import asyncio
from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Action, Event, AuditLog, Diagnosis
from app.config import settings
from app.razorpay_client import retry_payment_on_razorpay, create_razorpay_payment_link
from app.messaging_client import send_multichannel_recovery_message
from app.slack_client import send_slack_alert
from app.crm_client import create_or_update_crm_ticket
from app.email_client import send_support_escalation_ticket_email

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

    # Extract order_id / payment_link_id / customer from event.raw_payload to track retries across attempts
    p_entity = (event.raw_payload or {}).get("payload", {}).get("payment", {}).get("entity", {})
    pl_entity = (event.raw_payload or {}).get("payload", {}).get("payment_link", {}).get("entity", {})
    order_id = p_entity.get("order_id")
    plink_id = pl_entity.get("id") or p_entity.get("payment_link_id")

    from sqlalchemy import or_
    conds = [Event.razorpay_payment_id == event.razorpay_payment_id]
    if order_id:
        conds.append(Event.raw_payload["payload"]["payment"]["entity"]["order_id"].astext == order_id)

    all_events_res = await db.execute(
        select(Action)
        .join(Event, Action.event_id == Event.id)
        .where(or_(*conds))
        .order_by(Action.executed_at.desc())
        .limit(20)
    )
    matched_prior_actions = all_events_res.scalars().all()
    attempt_number = len(matched_prior_actions) + 1

    # ──────────────────────────────────────────────────────────────────
    # CONDITIONAL ESCALATION RULE:
    # If payment failed > 3 times -> Escalate to Support Specialist (Case 3)
    # Otherwise (<= 3 attempts) -> Follow Case 2 (Customer 1-Click Recovery)
    # ──────────────────────────────────────────────────────────────────
    if attempt_number > 3:
        action_type = "escalate_to_human"
        action_input = {
            "razorpay_payment_id": event.razorpay_payment_id,
            "reason": f"Payment failed {attempt_number} times (exceeded 3-attempt limit). Dispatched to Customer Support specialist."
        }
    elif action_type == "escalate_to_human" and attempt_number <= 3:
        # If <= 3 attempts, prioritize Case 2 customer 1-click recovery
        action_type = "send_reminder_email"
        action_input = {
            "customer_id": event.customer_id,
            "reason": event.error_description or "Payment retry reminder"
        }

    # STOPPING RULE 2: cooldown between actions on the same payment
    if matched_prior_actions and action_type != "escalate_to_human":
        last = matched_prior_actions[0]
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
                summary=f"Guardrail triggered: Attempt #{attempt_number} ({action_type}) skipped due to active cooldown window ({diff.total_seconds() / 3600:.1f}h < {settings.retry_cooldown_hours}h)",
            )
            db.add(audit)
            await db.commit()
            return action

    # When failure occurs, recovery is initiated (Email/WhatsApp link sent or retry scheduled)
    # The actual revenue is NOT recovered until the customer pays or retry completes
    amount_recovered = 0
    action_status = "pending"
    summary_label = ""

    # Extract genuine real customer metadata from the incoming Razorpay event payload
    p_entity = (event.raw_payload or {}).get("payload", {}).get("payment", {}).get("entity", {})
    pl_entity = (event.raw_payload or {}).get("payload", {}).get("payment_link", {}).get("entity", {})
    notes_data = p_entity.get("notes", {}) if isinstance(p_entity.get("notes"), dict) else {}

    real_name = (
        notes_data.get("name")
        or notes_data.get("customer_name")
        or pl_entity.get("customer", {}).get("name")
        or action_input.get("customer_name")
        or "Valued Customer"
    )

    real_email = (
        p_entity.get("email")
        or pl_entity.get("customer", {}).get("email")
        or (event.customer_id if "@" in (event.customer_id or "") else None)
        or settings.support_email
    )

    real_phone = (
        p_entity.get("contact")
        or pl_entity.get("customer", {}).get("contact")
        or (event.customer_id if (event.customer_id or "").startswith("+") or (event.customer_id or "").isdigit() else None)
        or "+918238012515"
    )

    real_reason = (
        event.error_description
        or action_input.get("reason")
        or event.error_code
        or "Payment processing delay"
    )

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
            # Generate genuine live workable Razorpay payment checkout link
            live_recovery_url = await create_razorpay_payment_link(
                amount_paise=event.amount_paise,
                customer_contact=real_phone,
                customer_email=real_email,
                customer_name=real_name,
                description=f"Payment Recovery - Order {order_id or event.razorpay_payment_id}",
                order_id=order_id or ""
            )
            success = await send_multichannel_recovery_message(
                customer_id=real_email,
                reason=real_reason,
                payment_id=event.razorpay_payment_id,
                amount_paise=event.amount_paise,
                recovery_url=live_recovery_url,
                customer_name=real_name
            )
            action_status = "pending"
            summary_label = f"1-Click Recovery Link Dispatched via WhatsApp & Email to {real_name} (Pending Payment)"
            
        # BRANCH 3: ESCALATE (CRM Support Ticket + Direct Admin Email + Slack Alert)
        elif action_type == "escalate_to_human":
            # Generate genuine live workable Razorpay payment checkout link
            live_recovery_url = await create_razorpay_payment_link(
                amount_paise=event.amount_paise,
                customer_contact=real_phone,
                customer_email=real_email,
                customer_name=real_name,
                description=f"Payment Recovery - Order {order_id or event.razorpay_payment_id}",
                order_id=order_id or ""
            )

            slack_ok = await send_slack_alert(
                razorpay_payment_id=event.razorpay_payment_id,
                reason=real_reason,
                customer_id=real_phone,
                amount_paise=event.amount_paise,
                attempt_count=attempt_number,
                recovery_url=live_recovery_url,
                customer_email=real_email
            )
            crm_ok = await create_or_update_crm_ticket(
                payment_id=event.razorpay_payment_id,
                reason=real_reason,
                customer_id=real_phone
            )
            email_ok = await send_support_escalation_ticket_email(
                payment_id=event.razorpay_payment_id,
                customer_id=real_phone,
                amount_paise=event.amount_paise,
                reason=real_reason,
                attempt_count=attempt_number,
                order_id=order_id or "",
                recovery_url=live_recovery_url,
                customer_name=real_name,
                customer_email=real_email,
                customer_phone=real_phone
            )
            action_status = "pending"
            summary_label = f"Support Review (Escalated to Human) - CRM Ticket & Direct Support Email Sent for {real_name}"
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
