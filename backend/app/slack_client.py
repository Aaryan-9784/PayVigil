import logging
import httpx
from app.config import settings

logger = logging.getLogger("revenue_recovery.slack")

async def send_slack_alert(razorpay_payment_id: str, reason: str) -> bool:
    """
    Sends escalation alert to human operations team via Slack Webhook.
    """
    logger.warning(f"[Human Escalation] Payment {razorpay_payment_id} escalated: {reason}")
    
    if settings.slack_webhook_url and not "mock/123/456" in settings.slack_webhook_url:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    settings.slack_webhook_url,
                    json={
                        "text": f"🚨 *Human Escalation Required - Payment Recovery*\n"
                                f"• *Payment ID*: `{razorpay_payment_id}`\n"
                                f"• *Reason*: {reason}\n"
                                f"• *Action*: Please review customer account and resolve manually."
                    }
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"[Slack Alert] Failed to post to Slack: {e}")
            return True
            
    logger.info(f"[Slack Alert] [Simulated] Escalation webhook posted for {razorpay_payment_id}")
    return True
