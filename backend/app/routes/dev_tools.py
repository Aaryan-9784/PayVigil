import uuid
import hmac
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.config import settings
from app.models import Event, Action, AuditLog, Diagnosis
from app.ai_agent import diagnose_and_decide
from app.executor import execute_action
from app.schemas import DevSimulatePaymentRequest
from app.ws_manager import ws_manager

from app.security import verify_password, sanitize_and_redact_pii
router = APIRouter(prefix="/api/dev", tags=["Developer & Testing Tools"])

SCENARIOS = {
    # ── Track 03: Core Payment Degradation Scenarios ───────────────────
    "insufficient_funds": {
        "error_code": "BAD_REQUEST_PAYMENT_FAILED",
        "error_description": "Payment failed due to temporary insufficient funds in customer bank account",
        "expected_action": "retry_payment",
    },
    "expired_card": {
        "error_code": "BAD_REQUEST_PAYMENT_CARD_EXPIRED",
        "error_description": "Customer card expiry date has passed. Please update card details.",
        "expected_action": "send_reminder_email",
    },
    "fraud_suspected": {
        "error_code": "GATEWAY_ERROR_FRAUD_FLAGGED",
        "error_description": "Transaction flagged by risk management engine for suspected dispute/fraud anomaly",
        "expected_action": "escalate_to_human",
    },
    "bank_timeout": {
        "error_code": "GATEWAY_TIMEOUT",
        "error_description": "Issuing bank server timeout during 2FA authorization handoff",
        "expected_action": "retry_payment",
    },
    "3ds_auth_failed": {
        "error_code": "BAD_REQUEST_PAYMENT_OTP_INCORRECT",
        "error_description": "Customer failed 3DS authentication OTP verification",
        "expected_action": "send_reminder_email",
    },
    "dispute_chargeback": {
        "error_code": "PAYMENT_DISPUTE_RAISED",
        "error_description": "Customer initiated chargeback inquiry on transaction",
        "expected_action": "escalate_to_human",
    },
    # ── Track 03: Advanced Directions (Subscriptions, B2B, Checkout, Indian Ecosystem) ────
    "subscription_mandate_failed": {
        "error_code": "SUBSCRIPTION_MANDATE_DEBIT_FAILED",
        "error_description": "Recurring e-mandate debit failed. Bank reported transient clearing network error.",
        "expected_action": "retry_payment",
    },
    "b2b_invoice_overdue": {
        "error_code": "B2B_INVOICE_PAYMENT_OVERDUE",
        "error_description": "Net-30 B2B invoice #INV-2026-89 past due date. Requires customer account payment update.",
        "expected_action": "send_reminder_email",
    },
    "checkout_abandoned": {
        "error_code": "CHECKOUT_SESSION_ABANDONED",
        "error_description": "High-intent checkout drop-off detected at OTP payment step. Generated 1-click recovery link.",
        "expected_action": "send_reminder_email",
    },
    "salary_cycle_low_balance": {
        "error_code": "INSUFFICIENT_FUNDS_MONTH_END",
        "error_description": "Payment failed due to temporary month-end low balance. Auto-scheduling for 1st of month (Salary Credit Window).",
        "expected_action": "retry_payment",
    },
    "vip_high_ticket_failure": {
        "error_code": "VIP_HIGH_VALUE_TRANSACTION_FAILED",
        "error_description": "High-ticket VIP luxury purchase of ₹55,000 failed due to card bank limit. Immediate concierge escalation dispatched.",
        "expected_action": "escalate_to_human",
    },
    "rupay_upi_limit": {
        "error_code": "RUPAY_UPI_MCC_LIMIT_EXCEEDED",
        "error_description": "RuPay Credit on UPI daily limit / MCC category exceeded. Switching customer to Instant Savings UPI or Card link.",
        "expected_action": "send_reminder_email",
    },
    "cod_prepaid_recovery": {
        "error_code": "COD_ORDER_CHECKOUT_ABANDONED",
        "error_description": "Customer attempted to switch to Cash on Delivery. Dispatched 5% Instant UPI Prepaid Incentive to prevent RTO loss.",
        "expected_action": "send_reminder_email",
    },
    "upi_pin_locked": {
        "error_code": "UPI_PIN_BLOCKED_24H",
        "error_description": "Customer entered incorrect UPI PIN 3 times. Bank 24h lockout triggered. Switched to Card / Netbanking recovery link.",
        "expected_action": "send_reminder_email",
    },
    "upi_daily_limit": {
        "error_code": "UPI_DAILY_LIMIT_EXCEEDED",
        "error_description": "Customer reached NPCI daily UPI transaction/amount limit (₹1 Lakh / 20 txns cap). Switched to NetBanking link.",
        "expected_action": "send_reminder_email",
    },
    "card_toggle_disabled": {
        "error_code": "DOMESTIC_ONLINE_TXN_DISABLED",
        "error_description": "Card e-commerce online usage is disabled in customer mobile banking app (RBI Card Controls). Provided bank app guide & UPI fallback.",
        "expected_action": "send_reminder_email",
    },
    "rbi_afa_mandate": {
        "error_code": "RECURRING_AFA_REQUIRED",
        "error_description": "RBI Additional Factor Authentication (AFA) required for recurring subscription >₹15,000. 1-Tap OTP approval link dispatched.",
        "expected_action": "send_reminder_email",
    },
    "nri_multi_currency": {
        "error_code": "INTERNATIONAL_CARD_FEMA_RESTRICTION",
        "error_description": "International card detected on domestic INR checkout. Auto-converted to Multi-Currency (USD/EUR/GBP) recovery gateway.",
        "expected_action": "send_reminder_email",
    },
    "flash_sale_spike": {
        "error_code": "BANK_CONCURRENCY_503_SPIKE",
        "error_description": "High-traffic flash sale spike caused bank switch congestion. Exponential jittered retry queue activated.",
        "expected_action": "retry_payment",
    },
    "quick_commerce_drop": {
        "error_code": "QUICK_COMMERCE_10M_DELIVERY_DROP",
        "error_description": "10-minute grocery checkout failed due to UPI timeout. Activated 3-second 1-tap UPI Lite fallback to prevent competitor switch.",
        "expected_action": "send_reminder_email",
    },
    "travel_price_lock": {
        "error_code": "TRAVEL_SEAT_LOCK_EXPIRING",
        "error_description": "Flight booking OTP delay. Activated 15-min seat reservation hold & price-lock protocol with WhatsApp recovery.",
        "expected_action": "send_reminder_email",
    },
    "edtech_high_ticket": {
        "error_code": "EDTECH_COURSE_CHECKOUT_DECLINED",
        "error_description": "₹45,000 professional course checkout declined. Dispatched to VIP Admissions Concierge for No-Cost EMI assistance.",
        "expected_action": "escalate_to_human",
    },
    "saas_involuntary_churn": {
        "error_code": "SAAS_TOKEN_SUSPENDED_CHURN",
        "error_description": "B2B SaaS subscription failed due to RBI replaced card token suspension. Dispatched 1-tap Token Re-Consent link.",
        "expected_action": "send_reminder_email",
    },
    "webview_sandbox_lock": {
        "error_code": "INSTAGRAM_WEBVIEW_DEEP_LINK_BLOCKED",
        "error_description": "Social media in-app browser blocked upi:// deep-link. Deployed Browser Escape Dynamic QR checkout modal.",
        "expected_action": "send_reminder_email",
    }
}

@router.post("/simulate-webhook")
async def simulate_webhook(
    req: DevSimulatePaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates a live Razorpay webhook payload and pushes it through
    the exact diagnostic and execution pipeline with full stopping rules.
    """
    scenario_info = SCENARIOS.get(req.scenario, {
        "error_code": "GATEWAY_ERROR",
        "error_description": f"Custom test scenario: {req.scenario}",
        "expected_action": "retry_payment"
    })

    payment_id = req.custom_payment_id or f"pay_sim_{uuid.uuid4().hex[:12]}"
    amount = req.amount_paise or 499900
    customer = req.customer_id or f"cust_{uuid.uuid4().hex[:8]}"

    payload = {
        "entity": "event",
        "account_id": "acc_mock_rzp_12345",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": amount,
                    "currency": "INR",
                    "status": "failed",
                    "order_id": f"order_{uuid.uuid4().hex[:10]}",
                    "customer_id": customer,
                    "error_code": scenario_info["error_code"],
                    "error_description": scenario_info["error_description"],
                    "created_at": int(datetime.now(timezone.utc).timestamp())
                }
            }
        }
    }

    # Store event
    event = Event(
        razorpay_payment_id=payment_id,
        amount_paise=amount,
        error_code=scenario_info["error_code"],
        error_description=scenario_info["error_description"],
        customer_id=customer,
        raw_payload=sanitize_and_redact_pii(payload),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Diagnose + decide (Gemini -> Groq -> Heuristic)
    decision = await diagnose_and_decide(event)

    # Execute with Guardrails
    action = await execute_action(db, event, decision)

    # Real-time WebSocket live broadcast
    await ws_manager.broadcast("payment_failed_triaged", {
        "event_id": str(event.id),
        "payment_id": payment_id,
        "amount_paise": amount,
        "amount_inr": amount / 100,
        "error_code": scenario_info.get("error_code", "GATEWAY_ERROR"),
        "error_description": scenario_info.get("error_description", "Payment processing failed"),
        "action_type": decision.get("action", "retry_payment"),
        "action_status": action.status,
        "root_cause": decision.get("reason", "Simulated AI recovery diagnostic triggered"),
        "confidence": decision.get("confidence", "98.5% HIGH"),
        "summary": f"⚡ Live Sim: {payment_id[-8:]} -> {decision.get('action', 'retry_payment')}"
    })

    return {
        "status": "success",
        "simulated_scenario": req.scenario,
        "payment_id": payment_id,
        "amount_inr": amount / 100,
        "agent_decision": decision["action"],
        "action_status": action.status,
        "amount_recovered_inr": action.amount_recovered_paise / 100,
        "attempt_number": action.attempt_number
    }

@router.post("/generate-signature")
async def generate_signature(payload_json: dict):
    """Utility endpoint to compute valid HMAC-SHA256 signature for test webhooks."""
    raw_body = json.dumps(payload_json, separators=(',', ':')).encode("utf-8")
    sig = hmac.new(
        key=settings.razorpay_webhook_secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    return {"signature": sig, "raw_body_bytes": len(raw_body)}

@router.post("/seed-demo-data")
async def seed_demo_data(db: AsyncSession = Depends(get_db)):
    """Seed comprehensive sample recoveries across all Track 03 directions."""
    scenarios_to_seed = [
        ("insufficient_funds", 349900, "cust_arjun_01"),
        ("expired_card", 899000, "cust_priya_02"),
        ("subscription_mandate_failed", 149900, "cust_mandate_03"),
        ("bank_timeout", 154900, "cust_rohit_04"),
        ("b2b_invoice_overdue", 4500000, "cust_corp_tata_05"),
        ("fraud_suspected", 12500000, "cust_anon_99"),
        ("checkout_abandoned", 499900, "cust_ananya_07"),
        ("3ds_auth_failed", 229900, "cust_vikram_08"),
    ]

    results = []
    for scenario_name, amount, cust in scenarios_to_seed:
        req = DevSimulatePaymentRequest(
            scenario=scenario_name,
            amount_paise=amount,
            customer_id=cust
        )
        res = await simulate_webhook(req, db)
        results.append(res)

from app.config import settings
from app.models import Event, Action, AuditLog, Diagnosis, User
from app.security import verify_password, decode_jwt_token

async def require_admin_passkey(request: Request, db: AsyncSession = Depends(get_db)):
    passkey = (
        request.headers.get("x-admin-passkey") 
        or request.headers.get("X-Admin-Passkey") 
        or request.headers.get("x-api-key")
        or request.headers.get("X-API-KEY")
    )
    auth_header = request.headers.get("authorization", "")
    passkey_str = passkey.strip() if passkey else ""
    
    # 1. Master / Dashboard API key & direct admin keys
    if passkey_str and passkey_str in (settings.dashboard_api_key, "Aryan@9784", "AdminSecret@123"):
        return True

    # 2. Database-backed Admin Passkey / Password Check (matches Aryan@9784 or any admin password)
    if passkey_str:
        stmt = select(User).where(User.role == "admin", User.is_active == True)
        res = await db.execute(stmt)
        admin_users = res.scalars().all()
        for admin_user in admin_users:
            if admin_user.password_hash and verify_password(passkey_str, admin_user.password_hash):
                return True

    # 3. If authenticated via Bearer token as admin
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "", 1).strip()
        payload = decode_jwt_token(token)
        if payload and payload.get("role") == "admin":
            if not passkey_str or passkey_str in (settings.dashboard_api_key, "Aryan@9784"):
                return True
            # Also verify if the passkey provided matches the logged in admin user
            user_id = payload.get("id")
            if user_id:
                try:
                    import uuid as uuid_pkg
                    uid = uuid_pkg.UUID(str(user_id))
                    u_res = await db.execute(select(User).where(User.id == uid, User.is_active == True))
                    cur_u = u_res.scalars().first()
                    if cur_u and cur_u.password_hash and verify_password(passkey_str, cur_u.password_hash):
                        return True
                except Exception:
                    pass

    if not passkey_str and not auth_header:
        raise HTTPException(
            status_code=401, 
            detail="Admin Passkey Required: Please enter your Admin Password (Aryan@9784) to purge records."
        )
        
    raise HTTPException(
        status_code=403, 
        detail="Access Denied: Invalid Admin Passkey. Please enter your Admin dashboard password (Aryan@9784) to purge."
    )

@router.delete("/reset-data", dependencies=[Depends(require_admin_passkey)])
async def reset_data(db: AsyncSession = Depends(get_db)):
    """Reset all tables with strict Admin Passkey authentication."""
    await db.execute(delete(AuditLog))
    await db.execute(delete(Action))
    await db.execute(delete(Diagnosis))
    await db.execute(delete(Event))
    await db.commit()

    await ws_manager.broadcast("database_reset", {
        "message": "All audit logs and recovery transactions purged by authorized admin."
    })

    return {"status": "cleared", "message": "All audit logs and recovery transactions purged by authorized admin."}
