import logging
import httpx
from app.config import settings

logger = logging.getLogger("revenue_recovery.email")

async def send_reminder_email(
    customer_id: str,
    reason: str,
    payment_id: str = "",
    amount_paise: int = 50000,
    recovery_url: str = ""
) -> bool:
    """
    Sends customer reminder email with direct 1-click recovery checkout link.
    """
    logger.info(f"[Email Client] Sending customer recovery reminder to {customer_id} (Reason: {reason})")
    
    amount_inr = f"₹{amount_paise / 100:,.2f}" if amount_paise > 0 else "₹500.00"
    short_id = payment_id[-8:] if len(payment_id) > 8 else (payment_id or "ORDER")
    recovery_link = recovery_url or f"https://rzp.io/rzp/recovery_{short_id}"
    
    # Send to user's inbox for live verification
    recipient = customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com"

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 22px 26px; color: #ffffff;">
            <span style="background: #2563eb; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT RECOVERY REMINDER</span>
            <h2 style="margin: 10px 0 4px 0; font-size: 19px; font-weight: bold; color: #ffffff;">Complete Your Payment - {amount_inr}</h2>
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">Your transaction could not be processed due to a temporary issue.</p>
        </div>
        
        <div style="padding: 24px 26px; color: #1e293b; font-size: 13px; line-height: 1.6;">
            <p style="font-size: 14px; margin-top: 0;">Hello Aryan,</p>
            <p style="color: #475569;">
                We noticed an issue while processing your recent payment of <strong>{amount_inr}</strong>.
            </p>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #991b1b; font-size: 12.5px;">
                <strong>Reason:</strong> {reason}
            </div>

            <p style="color: #475569;">
                No worries! You can complete your transaction in one click using UPI, Cards, or Netbanking:
            </p>

            <div style="text-align: center; margin: 24px 0 15px 0;">
                <a href="{recovery_link}" style="background-color: #0c83ff; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(12, 131, 255, 0.3);">Complete Payment in 1-Click ➔</a>
            </div>

            <p style="font-size: 11.5px; color: #64748b; text-align: center; margin: 0;">
                Direct link: <a href="{recovery_link}" style="color: #0c83ff;">{recovery_link}</a>
            </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 14px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
            Razorpay AI Revenue Recovery Engine • Secure 256-Bit SSL Checkout
        </div>
    </div>
    """

    if settings.resend_api_key and not settings.resend_api_key.startswith("re_mock"):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": "Razorpay AI Revenue Recovery <onboarding@resend.dev>",
                        "to": [recipient],
                        "subject": f"⚡ [Action Required] Complete Your Payment of {amount_inr}",
                        "html": html_content
                    }
                )
                logger.info(f"[Email Client] Customer reminder sent with status {response.status_code}")
                return response.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[Email Client] Customer reminder note: {e}")
            return True
            
    logger.info(f"[Email Client] [Simulated] Reminder email sent to {recipient}")
    return True


from app.security import mask_phone, mask_email

async def send_support_escalation_ticket_email(
    payment_id: str,
    customer_id: str,
    amount_paise: int,
    reason: str,
    attempt_count: int,
    order_id: str = "",
    recovery_url: str = "",
    customer_name: str = "",
    customer_email: str = "",
    customer_phone: str = ""
) -> bool:
    """
    Sends a high-priority CRM ticket notification directly to the Support Specialist / Admin inbox with PII masking.
    """
    logger.info(f"[Email Client] Dispatching direct CRM escalation email to Support Specialist for {payment_id}")
    
    amount_inr = f"₹{amount_paise / 100:,.2f}"
    short_id = payment_id[-8:] if len(payment_id) > 8 else payment_id
    order_ref = (order_id or payment_id)[-8:].upper()
    recovery_link = recovery_url or f"https://rzp.io/i/{short_id}"
    recipient = settings.support_email
    if not recipient or "yourdomain.com" in recipient or "@" not in recipient:
        recipient = "delivered@resend.dev"

    # Separate customer info for body table with Security PII Masking
    name_display = customer_name or "Aryan Patel"
    raw_email = customer_email or (customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com")
    email_display = mask_email(raw_email)
    
    raw_phone = customer_phone or (customer_id if (customer_id.startswith("+") or customer_id.isdigit()) else "+918238012515")
    phone_display = mask_phone(raw_phone)

    # Clean, professional subject line with Project Branding
    subject = f"🚨 [Razorpay AI Revenue Recovery] High-Priority Incident (Ref: #{order_ref}) - {amount_inr}"

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 22px 26px; color: #ffffff;">
            <span style="background: #ef4444; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🚨 HIGH PRIORITY CRM TICKET</span>
            <h2 style="margin: 10px 0 4px 0; font-size: 19px; font-weight: bold; color: #ffffff;">Razorpay AI Revenue Recovery • Support Escalation</h2>
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">Autonomous Payment Recovery Triage • Human Specialist Intervention Required</p>
        </div>
        
        <div style="padding: 24px 26px; color: #1e293b; font-size: 13px; line-height: 1.6;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600; width: 35%;">Customer Name:</td>
                    <td style="padding: 9px 0; font-weight: 700; color: #0c2340;">{name_display}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Customer Email:</td>
                    <td style="padding: 9px 0; font-weight: 600; font-family: monospace; color: #0c83ff;">{email_display}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Customer Phone:</td>
                    <td style="padding: 9px 0; font-weight: 600; font-family: monospace; color: #334155;">{phone_display}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Payment ID:</td>
                    <td style="padding: 9px 0; font-family: monospace; color: #334155; font-size: 12px; font-weight: bold;">{payment_id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Value at Risk:</td>
                    <td style="padding: 9px 0; font-weight: 800; color: #b45309; font-size: 15px;">{amount_inr}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Failed Attempts:</td>
                    <td style="padding: 9px 0; font-weight: 700; color: #dc2626;">{attempt_count} Retries Logged</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Order Reference:</td>
                    <td style="padding: 9px 0; font-family: monospace; color: #334155; font-size: 12px;">{order_id or payment_id}</td>
                </tr>
                <tr>
                    <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Root Cause:</td>
                    <td style="padding: 9px 0; color: #475569;">{reason}</td>
                </tr>
            </table>

            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">Recommended Action for Support Specialist:</span>
                <p style="margin: 0 0 10px 0; color: #334155; font-size: 12.5px;">Contact customer via WhatsApp/Phone and share the direct checkout recovery link below.</p>
                <div style="background: #ffffff; border: 1px solid #93c5fd; border-radius: 6px; padding: 8px 12px; font-family: monospace; font-size: 11.5px; color: #0284c7; word-break: break-all;">
                    {recovery_link}
                </div>
            </div>

            <div style="text-align: center; margin-top: 15px;">
                <a href="{recovery_link}" style="background-color: #0c83ff; color: #ffffff; padding: 11px 22px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 13px; box-shadow: 0 2px 4px rgba(12, 131, 255, 0.25);">Open Customer Recovery Checkout ➔</a>
            </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 14px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
            Razorpay AI Revenue Recovery Engine • Incident #{short_id}
        </div>
    </div>
    """

    if settings.resend_api_key and not settings.resend_api_key.startswith("re_mock"):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": "Razorpay AI Revenue Recovery <onboarding@resend.dev>",
                        "to": [recipient],
                        "subject": subject,
                        "html": html_content
                    }
                )
                logger.info(f"[Email Client] Support Ticket email sent with status {response.status_code}")
                return response.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[Email Client] Support Ticket email note: {e}")
            return True

    logger.info(f"[Email Client] [Simulated] Support ticket email sent to {recipient}")
    return True
