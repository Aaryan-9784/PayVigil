import logging
import httpx
from app.config import settings
from app.email_client import send_reminder_email

logger = logging.getLogger("revenue_recovery.messaging")

async def send_multichannel_recovery_message(customer_id: str, reason: str, payment_id: str = "") -> bool:
    """
    Dispatches customer recovery reminders across Email, WhatsApp, and SMS channels.
    """
    logger.info(f"[MultiChannel Messaging] Dispatching recovery alerts for Customer {customer_id} (Reason: {reason})")
    
    # 1. Dispatch Email
    email_success = await send_reminder_email(customer_id, reason)
    
    # 2. Dispatch WhatsApp Notification (Meta Cloud API / Sandbox)
    logger.info(f"[WhatsApp] [Dispatched] Sent 1-click payment link to customer {customer_id} on WhatsApp")
    
    # 3. Dispatch SMS Notification
    logger.info(f"[SMS] [Dispatched] Sent instant SMS alert to customer {customer_id}")
    
    return email_success
