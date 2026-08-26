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

logger = logging.getLogger("revenue_recovery.webhooks")
router = APIRouter()

@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # 1. Read RAW request body bytes first
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify signature FIRST, before any parsing or DB writes
    verify_razorpay_signature(raw_body, signature, settings.razorpay_webhook_secret)

    payload = await request.json()

    if payload.get("event") != "payment.failed":
        return {"status": "ignored", "reason": "not a payment.failed event"}

    payment_payload = payload.get("payload", {}).get("payment", {})
    payment_entity = payment_payload.get("entity", {})
    razorpay_payment_id = payment_entity.get("id")

    if not razorpay_payment_id:
        raise HTTPException(status_code=400, detail="Missing payment entity ID")

    # 2. Idempotency check — do not process the same payment_id + event twice
    existing = await db.execute(
        select(Event).where(Event.razorpay_payment_id == razorpay_payment_id)
    )
    if existing.scalar_one_or_none() is not None:
        return {"status": "duplicate_ignored", "payment_id": razorpay_payment_id}

    # 3. Store the event
    event = Event(
        razorpay_payment_id=razorpay_payment_id,
        amount_paise=payment_entity.get("amount", 0),
        error_code=payment_entity.get("error_code"),
        error_description=payment_entity.get("error_description"),
        customer_id=payment_entity.get("customer_id") or payment_entity.get("contact") or payment_entity.get("email"),
        raw_payload=payload,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # 4. Diagnose + decide (AI agent: Gemini → Groq → heuristic)
    decision = await diagnose_and_decide(event)

    # 5. Execute with stopping rules & log
    action = await execute_action(db, event, decision)

    return {
        "status": "processed",
        "event_id": str(event.id),
        "decision": decision["action"],
        "action_status": action.status if action else "completed"
    }
