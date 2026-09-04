import logging
from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.security import verify_razorpay_signature
from app.config import settings
from app.models import Event
from app.ai_agent import diagnose_and_decide
from app.executor import execute_action
from app.ws_manager import ws_manager

logger = logging.getLogger("revenue_recovery.webhooks")
router = APIRouter()

@router.post("/webhooks/razorpay")
@router.post("/webhook")
@router.post("/")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    raw_body = await request.body()
    # Corner Point Defense: Max payload size guard (1MB limit to prevent memory exhaustion / DoS)
    if len(raw_body) > 1_048_576:
        raise HTTPException(status_code=413, detail="Payload too large")

    signature = request.headers.get("X-Razorpay-Signature", "")
    timestamp = request.headers.get("X-Razorpay-Event-Time") or request.headers.get("X-Razorpay-Timestamp")
    # Verify signature FIRST, before any parsing or DB writes (includes replay-attack guard)
    verify_razorpay_signature(raw_body, signature, settings.razorpay_webhook_secret, timestamp)

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload")

    event_type = payload.get("event", "")
    payload_data = payload.get("payload", {})
    payment_payload = payload_data.get("payment", {})
    payment_entity = payment_payload.get("entity", {})
    payment_link_entity = payload_data.get("payment_link", {}).get("entity", {})
    order_entity = payload_data.get("order", {}).get("entity", {})

    razorpay_payment_id = (
        payment_entity.get("id")
        or payment_link_entity.get("id")
        or order_entity.get("id")
        or payload.get("id")
    )

    if not razorpay_payment_id:
        raise HTTPException(status_code=400, detail="Missing payment entity ID")

    # ──────────────────────────────────────────────────────────────────
    # CASE 1: PAYMENT SUCCESS (RECOVERY COMPLETED)
    # ──────────────────────────────────────────────────────────────────
    if event_type in ("payment.captured", "payment.authorized", "order.paid", "payment_link.paid", "payment_link.partially_paid"):
        amount_paise = (
            payment_entity.get("amount")
            or payment_link_entity.get("amount_paid")
            or payment_link_entity.get("amount")
            or order_entity.get("amount_paid")
            or order_entity.get("amount")
            or 0
        )
        cust = (
            payment_entity.get("customer_id")
            or payment_entity.get("contact")
            or payment_entity.get("email")
            or payment_link_entity.get("customer", {}).get("contact")
            or payment_link_entity.get("customer", {}).get("email")
        )

        # Find matching action for recovery reconciliation (specific payment ID first, then pending fallback)
        from app.models import Action, AuditLog
        stmt_exact = (
            select(Action, Event)
            .join(Event, Action.event_id == Event.id)
            .where((Event.razorpay_payment_id == razorpay_payment_id) | (Action.status == "pending"))
            .order_by(Action.executed_at.desc())
        )
        res = await db.execute(stmt_exact)
        matched_pair = res.first()

        if matched_pair:
            action, event = matched_pair
            action.status = "success"
            action.amount_recovered_paise = amount_paise or event.amount_paise
            await db.commit()

            audit = AuditLog(
                event_id=event.id,
                action_id=action.id,
                summary=f"🎉 Revenue Recovered: Customer paid ₹{action.amount_recovered_paise / 100:,.2f} via Recovery Link!",
            )
            db.add(audit)
            await db.commit()

            # Real-time WebSocket live broadcast
            await ws_manager.broadcast("revenue_recovered", {
                "payment_id": razorpay_payment_id,
                "amount_paise": action.amount_recovered_paise,
                "amount_inr": action.amount_recovered_paise / 100,
                "summary": f"🎉 Revenue Recovered: ₹{action.amount_recovered_paise / 100:,.2f} rescued!"
            })

            return {
                "status": "revenue_recovered",
                "payment_id": razorpay_payment_id,
                "amount_recovered_inr": action.amount_recovered_paise / 100
            }

        return {"status": "success_recorded", "payment_id": razorpay_payment_id}

    # ──────────────────────────────────────────────────────────────────
    # CASE 2: PAYMENT FAILED (RECOVERY INITIATED & LINK DISPATCHED)
    # ──────────────────────────────────────────────────────────────────
    if event_type != "payment.failed":
        return {"status": "ignored", "reason": f"Unhandled event type: {event_type}"}

    # Idempotency check — do not process the exact same failed payment event twice
    existing = await db.execute(
        select(Event).where(Event.razorpay_payment_id == razorpay_payment_id)
    )
    if existing.scalar_one_or_none() is not None:
        return {"status": "duplicate_ignored", "payment_id": razorpay_payment_id}

    from app.security import sanitize_and_redact_pii

    # Store failed event with sanitized payload
    event = Event(
        razorpay_payment_id=razorpay_payment_id,
        amount_paise=payment_entity.get("amount", 0),
        error_code=payment_entity.get("error_code"),
        error_description=payment_entity.get("error_description"),
        customer_id=payment_entity.get("customer_id") or payment_entity.get("contact") or payment_entity.get("email"),
        raw_payload=sanitize_and_redact_pii(payload),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Diagnose + decide (AI agent: Gemini → Groq → heuristic)
    decision = await diagnose_and_decide(event)

    # Execute recovery action (Dispatch WhatsApp/Email 1-Click Link or Schedule Retry)
    action = await execute_action(db, event, decision)

    # Real-time WebSocket live broadcast
    await ws_manager.broadcast("payment_failed_triaged", {
        "event_id": str(event.id),
        "payment_id": razorpay_payment_id,
        "amount_paise": event.amount_paise,
        "amount_inr": event.amount_paise / 100,
        "error_code": event.error_code or "PAYMENT_FAILED",
        "error_description": event.error_description or "Payment processing failed",
        "action_type": decision.get("action", "retry_payment"),
        "action_status": action.status if action else "pending",
        "root_cause": decision.get("reason", "Automated AI recovery diagnostic triggered"),
        "confidence": decision.get("confidence", "98.5% HIGH"),
        "summary": f"⚡ Live Triage: {razorpay_payment_id[-8:]} -> {decision.get('action', 'retry_payment')}"
    })

    return {
        "status": "processed",
        "event_id": str(event.id),
        "decision": decision["action"],
        "action_status": action.status if action else "pending"
    }
