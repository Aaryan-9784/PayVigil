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
        prompt = f"{SYSTEM_PROMPT}\n\nPayment event:\n{_build_user_message(event)}"
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        result = _parse_llm_response(response.text, event)
        if result:
            logger.info("Diagnosis completed via Gemini.")
        return result
    except Exception as e:
        logger.warning(f"Gemini API request failed ({e}), trying next provider.")
        return None


async def _try_groq(event: Event) -> Optional[dict]:
    client = _get_groq_client()
    if client is None:
        return None
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_message(event)},
            ],
            temperature=0,
            max_tokens=512,
        )
        raw = completion.choices[0].message.content
        result = _parse_llm_response(raw, event)
        if result:
            logger.info("Diagnosis completed via Groq (Llama 3.1 70B).")
        return result
    except Exception as e:
        logger.warning(f"Groq API request failed ({e}), trying next provider.")
        return None


# ---------------------------------------------------------------------------
# Deterministic heuristic fallback (always available, no API key needed)
# ---------------------------------------------------------------------------
def _classify_heuristic(event: Event) -> dict:
    """Accurate offline/dev classification adhering to exact agent rules."""
    err_code = (event.error_code or "").lower()
    err_desc = (event.error_description or "").lower()
    combined = f"{err_code} {err_desc}"

    # Fraud / Dispute / High-Risk -> Escalate
    if any(k in combined for k in ["fraud", "dispute", "chargeback", "risk_high", "suspected", "blacklisted", "security_violation"]):
        return {
            "action": "escalate_to_human",
            "input": {
                "razorpay_payment_id": event.razorpay_payment_id,
                "reason": f"High risk or disputed transaction flagged: {event.error_description or event.error_code or 'Security flag'}"
            }
        }

    # Customer Action Required (Expired card, incorrect CVV, 3DS Auth failure) -> Email
    if any(k in combined for k in ["expired", "card_expired", "invalid_cvv", "incorrect_cvv", "auth_failed", "authentication_failed", "otp", "3ds", "mandate_revoked"]):
        return {
            "action": "send_reminder_email",
            "input": {
                "customer_id": event.customer_id or f"cust_{event.razorpay_payment_id[-8:]}",
                "reason": event.error_description or "Payment method requires customer update (expired card or authentication issue)"
            }
        }

    # Transient Failures (Insufficient funds, timeout, bank downtime, gateway error) -> Retry
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
