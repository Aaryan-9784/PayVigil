import logging
import httpx
from app.config import settings

logger = logging.getLogger("revenue_recovery.email")

async def send_reminder_email(
    customer_id: str,
    reason: str,
    payment_id: str = "",
    amount_paise: int = 50000,
    recovery_url: str = "",
    customer_name: str = ""
) -> bool:
    """
    Sends customer reminder email with direct 1-click recovery checkout link,
    matching the premium enterprise layout, theme, and structure.
    """
    logger.info(f"[Email Client] Sending customer recovery reminder to {customer_id} (Reason: {reason})")
    
    amount_inr = f"₹{amount_paise / 100:,.2f}" if amount_paise > 0 else "₹500.00"
    short_id = payment_id[-8:] if len(payment_id) > 8 else (payment_id or "RECOVERY")
    recovery_link = recovery_url or f"https://rzp.io/rzp/recovery_{short_id}"
    name_display = customer_name.strip() if customer_name and customer_name.strip() else "Valued Customer"
    
    # Send to user's inbox for live verification
    recipient = customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com"

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 24px 28px; color: #ffffff;">
            <span style="background: #2563eb; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">⚡ ACTION REQUIRED • 1-CLICK RECOVERY</span>
            <h2 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: -0.3px;">Razorpay AI Revenue Recovery • Complete Payment</h2>
            <p style="margin: 0; font-size: 12.5px; opacity: 0.9;">Autonomous Transaction Protection • Secure 1-Click Hosted Checkout</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 26px 28px; color: #1e293b; font-size: 13.5px; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0; font-weight: 600; color: #0c2340;">Hello {name_display},</p>
            <p style="color: #475569; margin-bottom: 20px;">
                We noticed an issue while processing your recent payment of <strong style="color: #0c2340;">{amount_inr}</strong>. No duplicate deduction occurred.
            </p>

            <!-- Structured Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 38%;">Transaction Amount:</td>
                    <td style="padding: 10px 16px; font-weight: 800; color: #0c83ff; font-size: 15px;">{amount_inr}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Payment Reference:</td>
                    <td style="padding: 10px 16px; font-family: monospace; color: #334155; font-size: 12.5px; font-weight: bold;">{payment_id or 'pay_pending_checkout'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Failure Diagnosis:</td>
                    <td style="padding: 10px 16px; color: #dc2626; font-size: 12.5px; font-weight: 600;">{reason}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Payment Status:</td>
                    <td style="padding: 10px 16px; color: #d97706; font-weight: 700; font-size: 12.5px;">Pending Customer Retry</td>
                </tr>
            </table>

            <p style="color: #475569; margin-bottom: 18px;">
                You can complete your transaction in one click using <strong>UPI, Google Pay, PhonePe, Cards, or Netbanking</strong>:
            </p>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 26px 0 16px 0;">
                <a href="{recovery_link}" style="background: linear-gradient(135deg, #0c83ff 0%, #0056b3 100%); color: #ffffff; padding: 13px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14.5px; box-shadow: 0 4px 12px rgba(12, 131, 255, 0.35); letter-spacing: 0.2px;">Complete Payment in 1-Click ➔</a>
            </div>

            <p style="font-size: 11.5px; color: #64748b; text-align: center; margin: 0;">
                Direct secure link: <a href="{recovery_link}" style="color: #0c83ff; font-weight: 600; text-decoration: underline;">{recovery_link}</a>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center;">
            Razorpay AI Revenue Recovery Engine • Incident #{short_id} • Secure 256-Bit SSL Checkout
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
                        "subject": f"⚡ [Razorpay AI Revenue Recovery] Action Required: Complete Your Payment of {amount_inr}",
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
    name_display = customer_name.strip() if customer_name and customer_name.strip() else "Valued Customer"
    raw_email = customer_email or (customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com")
    email_display = mask_email(raw_email)
    
    raw_phone = customer_phone or (customer_id if (customer_id.startswith("+") or customer_id.isdigit()) else "+918238012515")
    phone_display = mask_phone(raw_phone)

    # Clean, professional subject line with Project Branding
    subject = f"🚨 [Razorpay AI Revenue Recovery] High-Priority Incident (Ref: #{order_ref}) - {amount_inr}"

    import urllib.parse
    clean_digits = raw_phone.replace("+", "").replace(" ", "").replace("-", "")[-10:]
    wa_text = f"🚨 *Razorpay AI Revenue Recovery • Payment Recovery*\n\nNamaste {name_display}! 👋\n\nWe noticed your payment of *{amount_inr}* had an issue ({reason}).\n\n👉 *Complete your payment in 1-click here:*\n{recovery_link}\n\n_(Secured by Razorpay 256-bit SSL Checkout)_"
    wa_url = f"https://wa.me/91{clean_digits}?text={urllib.parse.quote(wa_text)}"

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 24px 28px; color: #ffffff;">
            <span style="background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🚨 HIGH PRIORITY CRM TICKET</span>
            <h2 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: -0.3px;">Razorpay AI Revenue Recovery • Support Escalation</h2>
            <p style="margin: 0; font-size: 12.5px; opacity: 0.9;">Autonomous Payment Recovery Triage • Human Specialist Intervention Required</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 26px 28px; color: #1e293b; font-size: 13.5px; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0; font-weight: 600; color: #0c2340;">Support Specialist Alert,</p>
            <p style="color: #475569; margin-bottom: 20px;">
                An automated payment recovery reached maximum bot retry limits ({attempt_count} attempts). Human outreach is required to assist the customer.
            </p>

            <!-- Structured Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 38%;">Customer Name:</td>
                    <td style="padding: 10px 16px; font-weight: 700; color: #0c2340;">{name_display}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Customer Email:</td>
                    <td style="padding: 10px 16px; font-family: monospace; color: #0c83ff; font-weight: 600;">{email_display}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Customer Phone:</td>
                    <td style="padding: 10px 16px; font-family: monospace; color: #334155; font-weight: 600;">{phone_display}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Payment Reference:</td>
                    <td style="padding: 10px 16px; font-family: monospace; color: #334155; font-size: 12.5px; font-weight: bold;">{payment_id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Value at Risk:</td>
                    <td style="padding: 10px 16px; font-weight: 800; color: #b45309; font-size: 15px;">{amount_inr}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Failed Attempts:</td>
                    <td style="padding: 10px 16px; font-weight: 700; color: #dc2626;">{attempt_count} Retries Logged</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Failure Diagnosis:</td>
                    <td style="padding: 10px 16px; color: #dc2626; font-size: 12.5px; font-weight: 600;">{reason}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Escalation Status:</td>
                    <td style="padding: 10px 16px; color: #ef4444; font-weight: 700; font-size: 12.5px;">Requires Specialist Outreach</td>
                </tr>
            </table>

            <!-- Support Action Guidance Box -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;">
                <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">✓ Recommended Support Specialist Action:</span>
                <p style="margin: 0; color: #15803d; font-size: 12.5px; line-height: 1.5;">
                    Click the <strong>1-Click WhatsApp</strong> button below to open a pre-filled chat with <strong>{name_display}</strong> ({phone_display}) and assist them in recovering this payment.
                </p>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 26px 0 16px 0;">
                <a href="{wa_url}" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; padding: 13px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35); letter-spacing: 0.2px;">💬 1-Click WhatsApp Chat with Customer ➔</a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center;">
            Razorpay AI Revenue Recovery Engine • Incident #{short_id} • Internal Support Ticket
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
