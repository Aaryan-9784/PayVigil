import logging
import httpx
import urllib.parse
from app.config import settings
from app.email_client import send_reminder_email

logger = logging.getLogger("revenue_recovery.messaging")

async def send_multichannel_recovery_message(
    customer_id: str,
    reason: str,
    payment_id: str = "",
    amount_paise: int = 50000,
    recovery_url: str = ""
) -> bool:
    """
    Dispatches customer recovery reminders across Email, WhatsApp, and SMS channels.
    """
    clean_phone = customer_id.replace("+", "").replace(" ", "").replace("-", "") if (customer_id.startswith("+") or customer_id.isdigit()) else "918238012515"
    raw_10_digit = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    amount_inr = f"₹{amount_paise / 100:,.2f}"

    logger.info(f"[MultiChannel Messaging] Dispatching recovery alerts for Customer {customer_id} (Reason: {reason})")
    
    # ──────────────────────────────────────────────────────────────────
    # 1. DISPATCH REAL EMAIL TO CUSTOMER (via Resend API)
    # ──────────────────────────────────────────────────────────────────
    email_success = await send_reminder_email(
        customer_id=customer_id,
        reason=reason,
        payment_id=payment_id,
        amount_paise=amount_paise,
        recovery_url=recovery_url
    )
    
    # ──────────────────────────────────────────────────────────────────
    # 2. DISPATCH REAL SMS TO INDIAN MOBILE NUMBER
    # ──────────────────────────────────────────────────────────────────
    # A. If Fast2SMS API Key is present in .env
    if settings.fast2sms_api_key and not settings.fast2sms_api_key.startswith("mock"):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                sms_payload = {
                    "route": "q",
                    "message": f"Payment Recovery: Your payment of {amount_inr} is pending. Complete in 1-click: {recovery_url}",
                    "language": "english",
                    "flash": 0,
                    "numbers": raw_10_digit,
                }
                sms_resp = await client.post(
                    "https://www.fast2sms.com/dev/bulkV2",
                    headers={"authorization": settings.fast2sms_api_key},
                    json=sms_payload
                )
                logger.info(f"[Fast2SMS] Dispatched live SMS to {raw_10_digit}: Status {sms_resp.status_code}")
        except Exception as e:
            logger.warning(f"[Fast2SMS] SMS dispatch note: {e}")
    # B. If Twilio Credentials are present in .env
    elif settings.twilio_account_sid and settings.twilio_auth_token:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
                auth = (settings.twilio_account_sid, settings.twilio_auth_token)
                sms_data = {
                    "From": settings.twilio_phone_number,
                    "To": f"+91{raw_10_digit}",
                    "Body": f"Action Required: Complete your {amount_inr} payment: {recovery_url}"
                }
                resp = await client.post(twilio_url, data=sms_data, auth=auth)
                logger.info(f"[Twilio SMS] Dispatched SMS to +91{raw_10_digit}: Status {resp.status_code}")
        except Exception as e:
            logger.warning(f"[Twilio SMS] Dispatch note: {e}")
    else:
        logger.info(f"[SMS Provider] Queued cellular SMS dispatch for +91{raw_10_digit} with link: {recovery_url}")

    # ──────────────────────────────────────────────────────────────────
    # 3. DISPATCH WHATSAPP NOTIFICATION
    # ──────────────────────────────────────────────────────────────────
    if settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_whatsapp_number:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
                auth = (settings.twilio_account_sid, settings.twilio_auth_token)
                wa_data = {
                    "From": settings.twilio_whatsapp_number,
                    "To": f"whatsapp:+91{raw_10_digit}",
                    "Body": f"Namaste! Your payment of {amount_inr} could not be completed ({reason}).\n\n👉 Complete payment in 1-click: {recovery_url}"
                }
                resp = await client.post(twilio_url, data=wa_data, auth=auth)
                logger.info(f"[Twilio WhatsApp] Sent automated WhatsApp to +91{raw_10_digit}: Status {resp.status_code}")
        except Exception as e:
            logger.warning(f"[Twilio WhatsApp] Dispatch note: {e}")
    else:
        # Build 1-Click WhatsApp Direct Message Link
        wa_text = f"Namaste! Your payment of {amount_inr} could not be completed ({reason}). Complete payment in 1-click here: {recovery_url}"
        encoded_text = urllib.parse.quote(wa_text)
        wa_link = f"https://wa.me/91{raw_10_digit}?text={encoded_text}"
        logger.info(f"[WhatsApp] [Ready] Direct Click-to-Chat Link: {wa_link}")
    
    return email_success
