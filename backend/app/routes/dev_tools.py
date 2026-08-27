import uuid
import hmac
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.config import settings
from app.models import Event, Action, AuditLog, Diagnosis
from app.ai_agent import diagnose_and_decide
from app.executor import execute_action
from app.schemas import DevSimulatePaymentRequest

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
    # ── Track 03: Advanced Directions (Subscriptions, B2B, Checkout) ────
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
        raw_payload=payload,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Diagnose + decide (Gemini -> Groq -> Heuristic)
    decision = await diagnose_and_decide(event)

    # Execute with Guardrails
    action = await execute_action(db, event, decision)

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

    return {"seeded_count": len(results), "sample": results}

@router.delete("/reset-data")
async def reset_data(db: AsyncSession = Depends(get_db)):
    """Reset all tables for clean testing."""
    await db.execute(delete(AuditLog))
    await db.execute(delete(Action))
    await db.execute(delete(Diagnosis))
    await db.execute(delete(Event))
    await db.commit()
    return {"status": "cleared"}
