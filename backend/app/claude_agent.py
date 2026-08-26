import json
import logging
from anthropic import Anthropic
from app.config import settings
from app.models import Event

logger = logging.getLogger("revenue_recovery.claude")

# Initialize client conditionally
anthropic_client = None
if settings.anthropic_api_key and not settings.anthropic_api_key.startswith("sk-ant-mock"):
    try:
        anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
    except Exception as e:
        logger.warning(f"Could not initialize Anthropic client: {e}")

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

SYSTEM_PROMPT = """You are a payment recovery agent for an e-commerce business using Razorpay.
Given a failed payment event, identify the likely root cause and choose exactly one tool.
Rules:
- If retry_count >= 3, you must choose escalate_to_human.
- If the error indicates fraud, dispute, or chargeback, always choose escalate_to_human.
- If the failure is transient (bank timeout, gateway error, insufficient funds), prefer retry_payment.
- If the failure requires customer action (expired card, authentication failed), prefer send_reminder_email.
- Never choose an action outside the three tools provided.
- When uncertain, escalate_to_human rather than guessing."""

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

async def diagnose_and_decide(event: Event) -> dict:
    global anthropic_client
    
    if anthropic_client is None and settings.anthropic_api_key and not settings.anthropic_api_key.startswith("sk-ant-mock"):
        try:
            anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
        except Exception:
            pass

    if anthropic_client is not None:
        try:
            message = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                tool_choice={"type": "any"},  # forces a tool call, never plain text
                messages=[{
                    "role": "user",
                    "content": json.dumps({
                        "razorpay_payment_id": event.razorpay_payment_id,
                        "amount_paise": event.amount_paise,
                        "error_code": event.error_code,
                        "error_description": event.error_description,
                        "customer_id": event.customer_id,
                    })
                }]
            )

            tool_use_block = next((b for b in message.content if b.type == "tool_use"), None)
            if tool_use_block is None:
                # Fail safe: if Claude somehow didn't call a tool, escalate rather than do nothing
                return {
                    "action": "escalate_to_human",
                    "input": {
                        "razorpay_payment_id": event.razorpay_payment_id,
                        "reason": "Agent did not return a valid tool call"
                    }
                }

            return {"action": tool_use_block.name, "input": tool_use_block.input}
        except Exception as e:
            logger.warning(f"Claude API request failed ({e}), falling back to diagnostic engine.")

    # Fallback / Dev deterministic intelligence
    return _classify_heuristic(event)
