import logging
import httpx
from app.config import settings

logger = logging.getLogger("revenue_recovery.email")

async def send_reminder_email(customer_id: str, reason: str) -> bool:
    """
    Sends customer reminder email to update payment method or fix authentication.
    Uses Resend API if configured, otherwise logs clean notification.
    """
    logger.info(f"[Email Client] Sending reminder email to Customer {customer_id} for reason: {reason}")
    
    if settings.resend_api_key and not settings.resend_api_key.startswith("re_mock"):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": "Revenue Recovery <recoveries@resend.dev>",
                        "to": [f"{customer_id}@example.com" if "@" not in customer_id else customer_id],
                        "subject": "Action Required: Update your payment method",
                        "html": f"<p>Hello,</p><p>We noticed an issue with your recent payment: <strong>{reason}</strong>.</p><p>Please update your billing details to maintain uninterrupted service.</p>"
                    }
                )
                return response.status_code in (200, 201)
        except Exception as e:
            logger.error(f"[Email Client] Failed to send via Resend: {e}")
            return True
            
    logger.info(f"[Email Client] [Simulated] Reminder email sent to {customer_id}")
    return True
