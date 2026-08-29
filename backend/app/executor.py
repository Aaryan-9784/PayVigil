import asyncio
from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Action, Event, AuditLog, Diagnosis
from app.config import settings
from app.razorpay_client import retry_payment_on_razorpay
from app.messaging_client import send_multichannel_recovery_message
from app.slack_client import send_slack_alert
from app.crm_client import create_or_update_crm_ticket

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

    # When failure occurs, recovery is initiated (Email/WhatsApp link sent or retry scheduled)
    # The actual revenue is NOT recovered until the customer pays or retry completes
    amount_recovered = 0
    action_status = "pending"
    summary_label = ""

    try:
        # BRANCH 1: RETRY (Wait buffer -> HTTP Request to Razorpay)
        if action_type == "retry_payment":
            delay_sec = action_input.get("delay_seconds", 0)
            if delay_sec > 0:
                logger.info(f"[Retry Flow] Waiting {delay_sec} seconds before retrying payment {event.razorpay_payment_id}...")
                await asyncio.sleep(delay_sec)
            
            # Simulated or queued retry
            success = await retry_payment_on_razorpay(action_input.get("razorpay_payment_id", event.razorpay_payment_id))
            action_status = "pending"
            summary_label = f"Smart Gateway Retry Scheduled for {event.razorpay_payment_id} (Awaiting Bank Confirmation)"
            
        # BRANCH 2: MESSAGE (Multi-channel: Email + WhatsApp + SMS)
        elif action_type == "send_reminder_email":
            success = await send_multichannel_recovery_message(
                customer_id=action_input.get("customer_id", event.customer_id or "cust_default"),
                reason=action_input.get("reason", event.error_description or "Payment retry reminder"),
                payment_id=event.razorpay_payment_id
            )
            action_status = "pending"
            summary_label = f"1-Click Recovery Link Dispatched via WhatsApp & Email to {event.customer_id or 'customer'} (Pending Payment)"
            
        # BRANCH 3: HUMAN (Slack Alert -> CRM Ticket Update)
        elif action_type == "escalate_to_human":
            slack_ok = await send_slack_alert(
                action_input.get("razorpay_payment_id", event.razorpay_payment_id),
                action_input.get("reason", "Escalated to human ops")
            )
            crm_ok = await create_or_update_crm_ticket(
                payment_id=action_input.get("razorpay_payment_id", event.razorpay_payment_id),
                reason=action_input.get("reason", "Escalated to human ops"),
                customer_id=event.customer_id or ""
            )
            action_status = "pending"
            summary_label = f"High-Risk Failure Escalated to Support Team (CRM & Slack Alert Sent)"
        else:
            action_status = "failed"
            summary_label = f"Unknown action: {action_type}"
    except Exception as e:
        logger.error(f"Execution error: {e}")
        action_status = "failed"
        summary_label = f"Action execution failed: {e}"

    # SAVE RESULT: Store action & audit records in Database
    action = Action(
        event_id=event.id,
        action_type=action_type,
        attempt_number=attempt_number,
        status=action_status,
        amount_recovered_paise=amount_recovered,
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)

    audit = AuditLog(
        event_id=event.id,
        diagnosis_id=diagnosis.id,
        action_id=action.id,
        summary=summary_label,
    )
    db.add(audit)
    await db.commit()
    return action
