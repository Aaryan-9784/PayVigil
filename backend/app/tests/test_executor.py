import pytest
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, delete
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import AsyncSessionLocal, init_db
from app.models import Event, Action, AuditLog, Diagnosis
from app.executor import execute_action
from app.config import settings

@pytest.fixture(autouse=True)
async def clean_database():
    await init_db()
    async with AsyncSessionLocal() as session:
        await session.execute(delete(AuditLog))
        await session.execute(delete(Action))
        await session.execute(delete(Diagnosis))
        await session.execute(delete(Event))
        await session.commit()
    yield

@pytest.mark.asyncio
async def test_stopping_rule_1_max_retry_attempts_exceeded():
    async with AsyncSessionLocal() as session:
        payment_id = f"pay_retry_limit_{uuid.uuid4().hex[:8]}"
        event = Event(
            razorpay_payment_id=payment_id,
            amount_paise=500000,
            error_code="BAD_REQUEST",
            raw_payload={}
        )
        session.add(event)
        await session.commit()
        await session.refresh(event)

        # Seed 3 prior actions with past timestamps so cooldown doesn't block them
        past_time = datetime.now(timezone.utc) - timedelta(hours=24)
        for i in range(1, 4):
            act = Action(
                event_id=event.id,
                action_type="retry_payment",
                attempt_number=i,
                status="failed",
                amount_recovered_paise=0,
                executed_at=past_time - timedelta(hours=24 - i)
            )
            session.add(act)
        await session.commit()

        # Execute 4th attempt with retry_payment decision
        decision = {
            "action": "retry_payment",
            "input": {"razorpay_payment_id": event.razorpay_payment_id, "delay_hours": 4}
        }
        fourth_action = await execute_action(session, event, decision)

        # Confirm 4th attempt automatically becomes escalate_to_human
        assert fourth_action.action_type == "escalate_to_human"
        assert fourth_action.attempt_number == 4

@pytest.mark.asyncio
async def test_stopping_rule_2_cooldown_window_skips_execution():
    async with AsyncSessionLocal() as session:
        payment_id = f"pay_cooldown_{uuid.uuid4().hex[:8]}"
        event = Event(
            razorpay_payment_id=payment_id,
            amount_paise=300000,
            raw_payload={}
        )
        session.add(event)
        await session.commit()
        await session.refresh(event)

        # 1st action executed now
        decision = {
            "action": "retry_payment",
            "input": {"razorpay_payment_id": event.razorpay_payment_id, "delay_hours": 4}
        }
        act1 = await execute_action(session, event, decision)
        assert act1.status in ("success", "failed")

        # 2nd action executed immediately (within 12h cooldown window)
        act2 = await execute_action(session, event, decision)
        assert act2.status == "skipped_stopping_rule"

        # Check audit log contains both entries
        audit_logs = await session.execute(
            select(AuditLog).where(AuditLog.event_id == event.id)
        )
        logs = audit_logs.scalars().all()
        assert len(logs) == 2
        assert any("cooldown" in l.summary.lower() for l in logs)

@pytest.mark.asyncio
async def test_dashboard_api_authentication_and_payload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request WITHOUT x-api-key header -> 401
        res_unauth = await client.get("/api/dashboard")
        assert res_unauth.status_code == 401

        # Request WITH invalid x-api-key header -> 401
        res_bad_key = await client.get("/api/dashboard", headers={"x-api-key": "wrong_key_12345"})
        assert res_bad_key.status_code == 401

        # Request WITH valid x-api-key header -> 200
        res_auth = await client.get("/api/dashboard", headers={"x-api-key": settings.dashboard_api_key})
        assert res_auth.status_code == 200
        data = res_auth.json()

        assert "total_recovered_paise" in data
        assert "total_at_risk_paise" in data
        assert "recovery_rate_pct" in data
        assert "recent_audit_log" in data
        assert isinstance(data["recent_audit_log"], list)
