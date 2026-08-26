from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Action, Event, AuditLog, Diagnosis
from app.config import settings
from app.razorpay_client import retry_payment_on_razorpay
from app.email_client import send_reminder_email as send_email
from app.slack_client import send_slack_alert

logger = logging.getLogger("revenue_recovery.executor")

async def execute_action(db: AsyncSession, event: Event, decision: dict) -> Action:
    action_type = decision["action"]
    action_input = decision.get("input", {})

    # Save diagnosis record for full auditability
    diagnosis = Diagnosis(
        event_id=event.id,
        root_cause=action_input.get("reason", f"Identified recovery path: {action_type}"),
        confidence="HIGH"
    )
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)

    # Count prior attempts for this payment
    result = await db.execute(
        select(func.count()).select_from(Action)
        .join(Event, Action.event_id == Event.id)
        .where(Event.razorpay_payment_id == event.razorpay_payment_id)
    )
    attempt_number = (result.scalar() or 0) + 1

    # STOPPING RULE 1: max retry attempts exceeded -> escalate to human
    if action_type == "retry_payment" and attempt_number > settings.max_retry_attempts:
        action_type = "escalate_to_human"
        action_input = {
            "razorpay_payment_id": event.razorpay_payment_id,
            "reason": f"Max retry attempts ({settings.max_retry_attempts}) exceeded. Guardrail triggered escalation."
        }

    # STOPPING RULE 2: cooldown between actions on the same payment
    last_action_res = await db.execute(
        select(Action)
        .join(Event, Action.event_id == Event.id)
        .where(Event.razorpay_payment_id == event.razorpay_payment_id)
        .order_by(Action.executed_at.desc())
    )
    last = last_action_res.scalars().first()
    
    if last is not None:
        last_time = last.executed_at
        now_time = datetime.now(timezone.utc)
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        
        diff = now_time - last_time
        if diff < timedelta(hours=settings.retry_cooldown_hours):
            action = Action(
                event_id=event.id,
                action_type=action_type,
                attempt_number=attempt_number,
                status="skipped_stopping_rule",
                amount_recovered_paise=0
            )
            db.add(action)
            await db.commit()
            await db.refresh(action)

            audit = AuditLog(
                event_id=event.id,
                diagnosis_id=diagnosis.id,
                action_id=action.id,
                summary=f"Guardrail triggered: {action_type} skipped due to active cooldown window ({diff.total_seconds() / 3600:.1f}h < {settings.retry_cooldown_hours}h)",
            )
            db.add(audit)
            await db.commit()
            return action

    status = "pending"
    amount_recovered = 0

    try:
        if action_type == "retry_payment":
            success = await retry_payment_on_razorpay(action_input.get("razorpay_payment_id", event.razorpay_payment_id))
            status = "success" if success else "failed"
            amount_recovered = event.amount_paise if success else 0
        elif action_type == "send_reminder_email":
            success = await send_email(
                action_input.get("customer_id", event.customer_id or "cust_default"),
                action_input.get("reason", event.error_description or "Payment retry reminder")
            )
            status = "success" if success else "failed"
        elif action_type == "escalate_to_human":
            success = await send_slack_alert(
                action_input.get("razorpay_payment_id", event.razorpay_payment_id),
                action_input.get("reason", "Escalated to human ops")
            )
            status = "success" if success else "failed"
        else:
            status = "failed"
    except Exception as e:
        logger.error(f"Execution error: {e}")
        status = "failed"

    action = Action(
        event_id=event.id,
        action_type=action_type,
        attempt_number=attempt_number,
        status=status,
        amount_recovered_paise=amount_recovered,
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)

    audit = AuditLog(
        event_id=event.id,
        diagnosis_id=diagnosis.id,
        action_id=action.id,
        summary=f"{action_type} attempt {attempt_number}: {status} (₹{amount_recovered / 100:.2f} recovered)",
    )
    db.add(audit)
    await db.commit()
    return action
