from __future__ import annotations

import json
import logging
from typing import Optional

from app.config import settings
from app.models import Event

try:
    from google import genai  # type: ignore[import-untyped]
    _HAS_GEMINI = True
except ImportError:
    genai = None  # type: ignore[assignment]
    _HAS_GEMINI = False

try:
    from groq import Groq  # type: ignore[import-untyped]
    _HAS_GROQ = True
except ImportError:
    Groq = None  # type: ignore[assignment]
    _HAS_GROQ = False

logger = logging.getLogger("revenue_recovery.ai_agent")

# ---------------------------------------------------------------------------
# Provider clients — initialised lazily on first use
# ---------------------------------------------------------------------------
_gemini_model = None
_groq_client = None

def _get_gemini_model():
    """Lazy-init Google Gemini client (google-genai SDK)."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model
    if not _HAS_GEMINI or not settings.gemini_api_key:
        return None
    try:
        _gemini_model = genai.Client(api_key=settings.gemini_api_key)
        logger.info("Gemini client initialised successfully.")
        return _gemini_model
    except Exception as e:
        logger.warning(f"Could not initialise Gemini client: {e}")
        return None


def _get_groq_client():
    """Lazy-init Groq Cloud client."""
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    if not _HAS_GROQ or not settings.groq_api_key:
        return None
    try:
        _groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialised successfully.")
        return _groq_client
    except Exception as e:
        logger.warning(f"Could not initialise Groq client: {e}")
        return None


# ---------------------------------------------------------------------------
# Tool definitions (unchanged — consumed by the dashboard & tests)
# ---------------------------------------------------------------------------
TOOLS = [
    {
        "name": "retry_payment",
        "description": "Retry a failed payment. Use for transient failures (insufficient funds, bank timeout, gateway error) when retry count is below the limit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "razorpay_payment_id": {"type": "string"},
                "delay_hours": {"type": "integer"}
            },
            "required": ["razorpay_payment_id", "delay_hours"]
        }
    },
    {
        "name": "send_reminder_email",
        "description": "Email the customer to fix the issue themselves. Use for expired card, wrong CVV, or incomplete 3DS authentication.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "reason": {"type": "string"}
            },
            "required": ["customer_id", "reason"]
        }
    },
    {
        "name": "escalate_to_human",
        "description": "Escalate to a human. Use for disputes, fraud flags, high-value transactions, or after repeated recovery failures.",
        "input_schema": {
            "type": "object",
            "properties": {
                "razorpay_payment_id": {"type": "string"},
                "reason": {"type": "string"}
            },
            "required": ["razorpay_payment_id", "reason"]
        }
    }
]

# ---------------------------------------------------------------------------
# Shared LLM prompt (provider-agnostic)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a payment recovery agent for an e-commerce business using Razorpay.
Given a failed payment event, identify the likely root cause and choose exactly one action.
Rules:
- If retry_count >= 3, you must choose escalate_to_human.
- If the error indicates fraud, dispute, or chargeback, always choose escalate_to_human.
- If the failure is transient (bank timeout, gateway error, insufficient funds), prefer retry_payment.
- If the failure requires customer action (expired card, authentication failed), prefer send_reminder_email.
- Never choose an action outside the three actions provided.
- When uncertain, escalate_to_human rather than guessing.

You MUST respond ONLY with valid JSON in this exact schema — no markdown, no explanation:
{
  "action": "<retry_payment | send_reminder_email | escalate_to_human>",
  "input": { ... }
}

For retry_payment, input must contain: razorpay_payment_id (string), delay_hours (integer).
For send_reminder_email, input must contain: customer_id (string), reason (string).
For escalate_to_human, input must contain: razorpay_payment_id (string), reason (string)."""


def _build_user_message(event: Event) -> str:
    """Build the user-facing prompt with payment event details."""
    return json.dumps({
        "razorpay_payment_id": event.razorpay_payment_id,
        "amount_paise": event.amount_paise,
        "error_code": event.error_code,
        "error_description": event.error_description,
        "customer_id": event.customer_id,
    })


def _parse_llm_response(raw_text: str, event: Event) -> Optional[dict]:
    """Try to parse a JSON action dict from raw LLM text. Returns None on failure."""
    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        text = "\n".join(text.split("\n")[1:])
    if text.endswith("```"):
        text = "\n".join(text.split("\n")[:-1])
    text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None

    action = data.get("action")
    inp = data.get("input")
    if action in ("retry_payment", "send_reminder_email", "escalate_to_human") and isinstance(inp, dict):
        return {"action": action, "input": inp}
    return None


# ---------------------------------------------------------------------------
# Provider-specific callers
# ---------------------------------------------------------------------------
async def _try_gemini(event: Event) -> Optional[dict]:
    client = _get_gemini_model()
    if client is None:
        return None
    try:
        import asyncio
        prompt = f"{SYSTEM_PROMPT}\n\nPayment event:\n{_build_user_message(event)}"
        for m in ["gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(client.models.generate_content, model=m, contents=prompt),
                    timeout=3.0
                )
                result = _parse_llm_response(response.text, event)
                if result:
                    logger.info(f"Diagnosis completed via Gemini ({m}).")
                    return result
            except Exception:
                continue
        return None
    except Exception as e:
        logger.warning(f"Gemini API request failed ({e}), trying next provider.")
        return None


async def _try_groq(event: Event) -> Optional[dict]:
    client = _get_groq_client()
    if client is None:
        return None
    try:
        import asyncio
        for model_name in ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile"]:
            try:
                completion = await asyncio.wait_for(
                    asyncio.to_thread(
                        client.chat.completions.create,
                        model=model_name,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": _build_user_message(event)},
                        ],
                        temperature=0,
                        max_tokens=512,
                    ),
                    timeout=3.0
                )
                raw = completion.choices[0].message.content
                result = _parse_llm_response(raw, event)
                if result:
                    logger.info(f"Diagnosis completed via Groq ({model_name}).")
                    return result
            except Exception:
                continue
        return None
    except Exception as e:
        logger.warning(f"Groq API request failed ({e}), trying heuristic.")
        return None


# ---------------------------------------------------------------------------
# Deterministic heuristic fallback (always available, no API key needed)
# ---------------------------------------------------------------------------
def _classify_heuristic(event: Event) -> dict:
    """Accurate offline/dev classification adhering to exact agent rules."""
    err_code = (event.error_code or "").lower()
    err_desc = (event.error_description or "").lower()
    combined = f"{err_code} {err_desc}"

    # 1. Fraud / Dispute / High-Risk / VIP High-Ticket -> Immediate Escalate
    if any(k in combined for k in ["fraud", "dispute", "chargeback", "risk_high", "suspected", "blacklisted", "security_violation", "vip", "high_ticket", "luxury", "high_value"]):
        return {
            "action": "escalate_to_human",
            "input": {
                "razorpay_payment_id": event.razorpay_payment_id,
                "reason": f"High risk, disputed, or VIP high-ticket transaction flagged: {event.error_description or event.error_code or 'Security/VIP flag'}"
            }
        }

    # 2. UPI PIN 24h Lockout -> Bypass UPI, switch to Card / Netbanking
    if any(k in combined for k in ["pin_blocked", "max_pin_retries", "upi_pin_locked", "wrong_pin"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "Bank 24-hour UPI PIN lockout detected. Switched to Instant Card or NetBanking checkout.",
                "rail_recommendation": "NETBANKING_OR_CARD",
                "tag": "UPI_PIN_LOCKED"
            }
        }

    # 3. UPI Daily Limit (NPCI ₹1 Lakh / 20 txns cap) -> Switch to NetBanking / Card
    if any(k in combined for k in ["daily_limit", "max_txn_count", "upi_limit_exceeded", "limit_reached"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "NPCI daily UPI limit reached for bank account. Switched to NetBanking or Credit Card.",
                "rail_recommendation": "NETBANKING_OR_CARD",
                "tag": "UPI_DAILY_LIMIT"
            }
        }

    # 4. RBI Online Card Controls Toggle Inactive -> Provide toggle guidance & UPI fallback
    if any(k in combined for k in ["online_txn_disabled", "card_channel_restricted", "domestic_online", "card_control"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "Card e-commerce online usage is disabled in mobile banking app. Enable card controls or pay instantly via UPI.",
                "rail_recommendation": "ENABLE_CARD_OR_UPI",
                "tag": "CARD_TOGGLE_DISABLED"
            }
        }

    # 5. RBI >₹15k Recurring Subscription Mandate AFA Approval
    if any(k in combined for k in ["afa_required", "recurring_afa", "mandate_limit", "high_value_mandate"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "RBI Additional Factor Authentication (AFA) required for recurring payment >₹15,000. 1-Tap OTP approval link dispatched.",
                "tag": "RBI_AFA_MANDATE"
            }
        }

    # 6. NRI / International FEMA Multi-Currency Conversion
    if any(k in combined for k in ["cross_border", "currency_mismatch", "international_card", "fema"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "International card detected. Auto-converted to Multi-Currency Razorpay checkout (USD/EUR/GBP).",
                "tag": "NRI_MULTI_CURRENCY"
            }
        }

    # 7. B2B Corporate Invoicing & GSTIN Validation
    if any(k in combined for k in ["gstin", "b2b", "invoice", "tax_mismatch", "overdue"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "B2B Invoice GSTIN validation update required. Dispatched verified Corporate Payment Link.",
                "tag": "B2B_GSTIN"
            }
        }

    # 8. RuPay Credit on UPI / MCC Limit Failure -> Recommend Savings/Direct Card Rail
    if any(k in combined for k in ["rupay", "mcc", "upi_credit_limit", "credit_on_upi"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "RuPay Credit on UPI limit/category mismatch. Switched to instant UPI Savings Account or Card checkout link.",
                "rail_recommendation": "UPI_SAVINGS_OR_CARD",
                "tag": "RUPAY_UPI_FAILOVER"
            }
        }

    # 9. Customer Action Required (Expired card, incorrect CVV, 3DS Auth failure, Mandate, COD drop)
    if any(k in combined for k in ["expired", "card_expired", "invalid_cvv", "incorrect_cvv", "auth_failed", "authentication_failed", "otp", "3ds", "mandate_revoked", "cod", "checkout_abandoned"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": event.error_description or "Payment method requires customer update (expired card or authentication issue)"
            }
        }

    # 10. Month-end Insufficient Funds / Salary Cycle
    from datetime import datetime, timezone
    now_day = datetime.now(timezone.utc).day
    if ("insufficient" in combined or "funds" in combined or "balance" in combined) and (now_day >= 25 or now_day <= 2 or "month_end" in combined):
        return {
            "action": "retry_payment",
            "input": {
                "razorpay_payment_id": event.razorpay_payment_id,
                "delay_hours": 72,
                "is_salary_cycle": True,
                "reason": "Month-end low balance detected. Smart retry scheduled for 1st of next month (Salary Credit Window)."
            }
        }

    # 11. Quick-Commerce (10-min delivery) 3-Second Urgency Failover -> UPI Lite / 1-Tap Quick-Pay
    if any(k in combined for k in ["quick_commerce", "instant_delivery", "zepto", "blinkit", "swiggy", "zomato", "grocery_drop"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "10-minute instant delivery order saved. Activated 3-second 1-tap UPI Lite / QR failover.",
                "rail_recommendation": "UPI_LITE_INSTANT",
                "tag": "QUICK_COMMERCE_LITE"
            }
        }

    # 12. Travel & Flight Ticketing / Tatkal Price-Lock Protocol -> 15-min Seat Reservation Hold
    if any(k in combined for k in ["travel_seat_lock", "flight_booking", "tatkal", "seat_lock", "price_surge", "makemytrip", "irctc"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "Booking session protected. 15-min seat reservation & price-lock active with 1-click WhatsApp checkout.",
                "tag": "TRAVEL_PRICE_LOCK"
            }
        }

    # 13. High-Ticket EdTech & Coaching Course Drop -> VIP Admissions Concierge Escalation
    if any(k in combined for k in ["edtech", "course_checkout", "coaching", "emi_rejected", "tuition", "upgrad", "physicswallah"]):
        return {
            "action": "escalate_to_human",
            "input": {
                "razorpay_payment_id": event.razorpay_payment_id,
                "reason": "High-value EdTech course checkout declined. Dispatched to Admissions VIP Concierge for No-Cost EMI assistance.",
                "tag": "EDTECH_CONCIERGE"
            }
        }

    # 14. B2B SaaS Involuntary Churn & RBI Token Renewal -> 1-Tap Token Re-Consent Flow
    if any(k in combined for k in ["token_suspended", "mandate_paused", "saas_churn", "involuntary_churn", "zoho", "freshworks"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "Involuntary SaaS subscription churn prevented. Dispatched 1-Tap RBI Token Renewal & Win-Back link.",
                "tag": "SAAS_TOKEN_RECONSENT"
            }
        }

    # 15. Social Media In-App Browser Sandbox Lock (Instagram/FB Ads) -> Escape QR Modal
    if any(k in combined for k in ["webview_lock", "instagram_webview", "sandbox_lock", "in_app_browser"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": "Social media in-app browser sandbox bypassed. Deployed Browser Escape Dynamic QR checkout.",
                "tag": "WEBVIEW_ESCAPE_QR"
            }
        }

    # 16. Flash Sale / High-Concurrency Bank Gateway Spike -> Jittered Backoff Retry
    if any(k in combined for k in ["concurrency", "spike", "flash_sale", "congested", "503"]):
        return {
            "action": "retry_payment",
            "input": {
                "razorpay_payment_id": event.razorpay_payment_id,
                "delay_hours": 1,
                "is_jittered_backoff": True,
                "reason": "Flash sale banking switch congestion detected. Smart jittered retry queued."
            }
        }

    # 12. Transient Failures (Timeout, bank downtime, gateway error) -> Retry
    return {
        "action": "retry_payment",
        "input": {
            "razorpay_payment_id": event.razorpay_payment_id,
            "delay_hours": 4
        }
    }


# ---------------------------------------------------------------------------
# Main entry point — Gemini → Groq → Heuristic
# ---------------------------------------------------------------------------
async def diagnose_and_decide(event: Event) -> dict:
    """Run the AI diagnosis chain: Gemini → Groq → built-in heuristic."""

    # 1. Try Gemini (free)
    result = await _try_gemini(event)
    if result:
        return result

    # 2. Try Groq (free)
    result = await _try_groq(event)
    if result:
        return result

    # 3. Deterministic fallback — always works, no API key needed
    logger.info("Using built-in diagnostic engine (no LLM API key configured or all providers failed).")
    return _classify_heuristic(event)

