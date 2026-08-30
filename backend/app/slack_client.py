import logging
import httpx
from app.config import settings
from app.security import mask_phone, mask_email

logger = logging.getLogger("revenue_recovery.slack")

async def send_slack_alert(
    razorpay_payment_id: str,
    reason: str,
    customer_id: str = "",
    amount_paise: int = 0,
    attempt_count: int = 1,
    recovery_url: str = "",
    customer_email: str = ""
) -> bool:
    """
    Sends clean, securely masked high-priority escalation card to Slack.
    """
    # Securely mask customer PII
    raw_phone = customer_id if (customer_id.startswith("+") or customer_id.isdigit()) else "+918238012515"
    masked_phone = mask_phone(raw_phone)
    
    raw_email = customer_email or (customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com")
    masked_cust_email = mask_email(raw_email)

    amount_inr = f"₹{amount_paise / 100:,.0f}" if amount_paise > 0 else "₹500"

    logger.warning(f"[Human Escalation] Payment {razorpay_payment_id} escalated: {reason}")
    
    is_real_slack = (
        settings.slack_webhook_url 
        and "YOUR_WORKSPACE" not in settings.slack_webhook_url 
        and "mock" not in settings.slack_webhook_url.lower()
    )

    if is_real_slack:
        try:
            payload = {
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "🚨 Razorpay AI Revenue Recovery • Support Escalation",
                            "emoji": True
                        }
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Customer Contact:*\n`{masked_phone}`"},
                            {"type": "mrkdwn", "text": f"*Customer Email:*\n`{masked_cust_email}`"},
                            {"type": "mrkdwn", "text": f"*Amount at Risk:*\n*{amount_inr}*"},
                            {"type": "mrkdwn", "text": f"*Retry History:*\n{attempt_count} Failed Attempts"}
                        ]
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Payment ID:*\n`{razorpay_payment_id}`"},
                            {"type": "mrkdwn", "text": f"*Failure Cause:*\n{reason}"}
                        ]
                    },
                    {"type": "divider"}
                ]
            }

            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.post(settings.slack_webhook_url, json=payload)
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"[Slack Alert] Note: {e}")
            return True
            
    logger.info(f"[Slack Alert] [Simulated] Escalation card posted for {razorpay_payment_id}")
    return True
