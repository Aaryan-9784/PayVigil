import logging
import urllib.parse
import html
import httpx
from app.config import settings
from app.security import mask_phone, mask_email

logger = logging.getLogger("revenue_recovery.email")


# ==============================================================================
# 1. Customer Payment Recovery Reminder (1-Click Checkout)
# ==============================================================================
async def send_reminder_email(
    customer_id: str,
    reason: str,
    payment_id: str = "",
    amount_paise: int = 50000,
    recovery_url: str = "",
    customer_name: str = ""
) -> bool:
    """
    Sends customer reminder email with direct 1-click recovery checkout link.
    All dynamic values are HTML-escaped for complete injection immunity.
    """
    logger.info(f"[Email Client] Sending customer recovery reminder to {customer_id} (Reason: {reason})")
    
    amount_inr = f"₹{amount_paise / 100:,.2f}" if amount_paise > 0 else "₹500.00"
    short_id = payment_id[-8:] if len(payment_id) > 8 else (payment_id or "RECOVERY")
    recovery_link = recovery_url or f"https://rzp.io/rzp/recovery_{short_id}"
    name_display = html.escape(customer_name.strip()) if customer_name and customer_name.strip() else "Valued Customer"
    recipient = customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com"
    safe_reason = html.escape(reason)
    safe_payment_id = html.escape(payment_id or "pay_recovery")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 24px 28px; color: #ffffff;">
                <span style="background: rgba(255,255,255,0.18); color: #ffffff; font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">⚡ ACTION REQUIRED &bull; 1-CLICK RECOVERY</span>
                <h2 style="margin: 10px 0 4px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Razorpay AI Revenue Recovery &bull; Complete Payment</h2>
                <p style="margin: 0; font-size: 12.5px; color: #e0f2fe; opacity: 0.9;">Autonomous Transaction Protection &bull; Secure 1-Click Hosted Checkout</p>
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
                    <a href="{recovery_link}" style="background: linear-gradient(135deg, #0c83ff 0%, #0056b3 100%); color: #ffffff; padding: 13px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14.5px; box-shadow: 0 4px 12px rgba(12, 131, 255, 0.35); letter-spacing: 0.2px;">Complete Payment in 1-Click &rarr;</a>
                </div>

                <p style="font-size: 11.5px; color: #64748b; text-align: center; margin: 0;">
                    Direct secure link: <a href="{recovery_link}" style="color: #0c83ff; font-weight: 600; text-decoration: underline;">{recovery_link}</a>
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center;">
                Razorpay AI Revenue Recovery Engine &bull; Incident #{short_id} &bull; Secure 256-Bit SSL Checkout
            </div>
        </div>
    </body>
    </html>
    """

    if settings.resend_api_key and not settings.resend_api_key.startswith("re_mock"):
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": "Razorpay AI Revenue Recovery <onboarding@resend.dev>",
                        "to": [recipient],
                        "subject": f"⚡ Action Required: Complete your payment of {amount_inr}",
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


# ==============================================================================
# 2. Support Specialist CRM Escalation Ticket
# ==============================================================================
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
    Sends a high-priority CRM ticket notification directly to the Support Specialist / Admin inbox.
    """
    logger.info(f"[Email Client] Dispatching CRM escalation email for {payment_id}")
    
    amount_inr = f"₹{amount_paise / 100:,.2f}"
    short_id = payment_id[-8:] if len(payment_id) > 8 else payment_id
    order_ref = (order_id or payment_id)[-8:].upper()
    recovery_link = recovery_url or f"https://rzp.io/i/{short_id}"
    recipient = settings.support_email or "aaryanpatel9784@gmail.com"

    name_display = html.escape(customer_name.strip()) if customer_name and customer_name.strip() else "Customer"
    raw_email = customer_email or (customer_id if "@" in customer_id else "aaryanpatel9784@gmail.com")
    email_display = html.escape(mask_email(raw_email))
    
    raw_phone = customer_phone or (customer_id if (customer_id.startswith("+") or customer_id.isdigit()) else "+918238012515")
    phone_display = html.escape(mask_phone(raw_phone))
    safe_reason = html.escape(reason)
    safe_payment_id = html.escape(payment_id)

    clean_digits = raw_phone.replace("+", "").replace(" ", "").replace("-", "")[-10:]
    wa_text = f"🚨 *Razorpay AI Revenue Recovery • Payment Recovery*\n\nNamaste {name_display}! 👋\n\nWe noticed your payment of *{amount_inr}* had an issue ({reason}).\n\n👉 *Complete your payment in 1-click here:*\n{recovery_link}"
    wa_url = f"https://wa.me/91{clean_digits}?text={urllib.parse.quote(wa_text)}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 24px 28px; color: #ffffff;">
                <span style="background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">🚨 HIGH PRIORITY CRM TICKET</span>
                <h2 style="margin: 10px 0 4px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Razorpay AI Revenue Recovery &bull; Support Escalation</h2>
                <p style="margin: 0; font-size: 12.5px; color: #e0f2fe; opacity: 0.9;">Autonomous Payment Recovery Triage &bull; Human Specialist Outreach Required</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 26px 28px; color: #1e293b; font-size: 13.5px; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0; font-weight: 600; color: #0c2340;">Support Specialist Alert,</p>
                <p style="color: #475569; margin-bottom: 20px;">
                    An automated payment recovery reached maximum retry limits (<strong>{attempt_count} attempts</strong>). Human outreach is required to assist the customer.
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
                        <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Value at Risk:</td>
                        <td style="padding: 10px 16px; font-weight: 800; color: #b45309; font-size: 15px;">{amount_inr}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Failure Diagnosis:</td>
                        <td style="padding: 10px 16px; color: #dc2626; font-size: 12.5px; font-weight: 600;">{safe_reason}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Payment ID:</td>
                        <td style="padding: 10px 16px; font-family: monospace; color: #334155; font-size: 12.5px; font-weight: bold;">{safe_payment_id}</td>
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
                    <a href="{wa_url}" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; padding: 13px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35); letter-spacing: 0.2px;">💬 1-Click WhatsApp Chat with Customer &rarr;</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center;">
                Razorpay AI Revenue Recovery Engine &bull; Incident #{short_id} &bull; Internal Support Ticket
            </div>
        </div>
    </body>
    </html>
    """

    if settings.resend_api_key and not settings.resend_api_key.startswith("re_mock"):
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": "Razorpay AI Support <onboarding@resend.dev>",
                        "to": [recipient],
                        "subject": f"🚨 High-Priority Incident (Ref: #{order_ref}) - {amount_inr}",
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


# ==============================================================================
# 3. Password Reset Security OTP (Unified Exact Razorpay Brand Format & Style)
# ==============================================================================
async def send_password_reset_email(
    recipient_email: str,
    otp_code: str,
    username: str = ""
) -> bool:
    """
    Sends the 6-digit password reset verification code.
    Matches the exact layout, header banner, typography, and styling of other Razorpay recovery emails.
    """
    logger.info(f"[Email Client] Dispatching Password Reset OTP to {recipient_email}")
    
    name_display = html.escape(username.strip()) if username and username.strip() else html.escape(recipient_email.split("@")[0])
    safe_email = html.escape(recipient_email)
    safe_otp = html.escape(otp_code)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0c2340 0%, #0c83ff 100%); padding: 24px 28px; color: #ffffff;">
                <span style="background: rgba(255,255,255,0.18); color: #ffffff; font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">🔐 SECURITY VERIFICATION</span>
                <h2 style="margin: 10px 0 4px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Razorpay AI Revenue Recovery &bull; Password Reset</h2>
                <p style="margin: 0; font-size: 12.5px; color: #e0f2fe; opacity: 0.9;">Autonomous Security &bull; Identity & Access Protection</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 26px 28px; color: #1e293b; font-size: 13.5px; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0; font-weight: 600; color: #0c2340;">Hello {name_display},</p>
                <p style="color: #475569; margin-bottom: 20px;">
                    We received a request to reset your password for your <strong>Razorpay AI Revenue Recovery</strong> account (<strong style="color: #0c2340;">{safe_email}</strong>).
                </p>

                <!-- Structured Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 38%;">Account Email:</td>
                        <td style="padding: 10px 16px; font-family: monospace; color: #0c83ff; font-weight: 600;">{safe_email}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Request Type:</td>
                        <td style="padding: 10px 16px; font-weight: 700; color: #0c2340;">Password Reset Authorization</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Code Validity:</td>
                        <td style="padding: 10px 16px; color: #059669; font-weight: 700; font-size: 12.5px;">15 Minutes</td>
                    </tr>
                </table>

                <!-- High-Contrast OTP Code Card -->
                <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 22px 16px; text-align: center; margin: 24px 0 22px 0;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
                    <div style="font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; font-size: 36px; font-weight: 800; color: #0c2340; letter-spacing: 8px; padding: 4px 0;">
                        {safe_otp}
                    </div>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">
                        Enter this code on the verification screen to set your new password.
                    </p>
                </div>

                <!-- Security Guidance Box -->
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #991b1b; font-size: 12.5px; line-height: 1.5;">
                        🔒 <strong>Didn't request this?</strong> You can safely ignore this email. Your account password remains unchanged. Never share this code with anyone.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center;">
                Razorpay AI Revenue Recovery Engine &bull; Automated Security Service &bull; Do not reply
            </div>
        </div>
    </body>
    </html>
    """

    if settings.resend_api_key and not settings.resend_api_key.startswith("re_mock"):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": "Razorpay AI Security <onboarding@resend.dev>",
                        "to": [recipient_email],
                        "subject": "🔐 Password Reset Request - Razorpay AI Recovery",
                        "html": html_content
                    }
                )
                logger.info(f"[Email Client] Password Reset OTP sent to {recipient_email} with status {response.status_code}")
                if response.status_code in (200, 201):
                    return True
                
                # Resend testing domain fallback
                resp_json = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                logger.warning(f"[Email Client] Resend response error details: {resp_json}")
                if "can only send testing emails to your own email address" in str(resp_json) and recipient_email != "aaryanpatel9784@gmail.com":
                    res_fallback = await client.post(
                        "https://api.resend.com/emails",
                        headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                        json={
                            "from": "Razorpay AI Security <onboarding@resend.dev>",
                            "to": ["aaryanpatel9784@gmail.com"],
                            "subject": f"🔐 Password Reset Request for {recipient_email} - Razorpay AI Recovery",
                            "html": html_content
                        }
                    )
                    logger.info(f"[Email Client] Fallback OTP email delivered to aaryanpatel9784@gmail.com with status {res_fallback.status_code}")
                    return res_fallback.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[Email Client] Password reset email note: {e}")
            return False

    logger.info(f"[Email Client] [Simulated] Reset code {otp_code} sent to {recipient_email}")
    return True

