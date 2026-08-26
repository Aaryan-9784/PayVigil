import pytest
import hmac
import hashlib
import json
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, func, delete
from app.main import app
from app.database import AsyncSessionLocal, init_db
from app.config import settings
from app.models import Event, Action, AuditLog, Diagnosis

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

def compute_signature(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

@pytest.mark.asyncio
async def test_webhook_invalid_signature_returns_400():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payment_id = f"pay_fake_sig_{uuid.uuid4().hex[:8]}"
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": 50000,
                        "error_code": "BAD_REQUEST"
                    }
                }
            }
        }
        body_bytes = json.dumps(payload).encode("utf-8")
        headers = {"X-Razorpay-Signature": "invalid_signature_hash_12345"}
        
        response = await client.post("/webhooks/razorpay", content=body_bytes, headers=headers)
        assert response.status_code == 400
        assert "Invalid webhook signature" in response.json()["detail"]

        # Confirm nothing was written to the database
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(Event).where(Event.razorpay_payment_id == payment_id))
            assert res.scalar_one_or_none() is None

@pytest.mark.asyncio
async def test_webhook_valid_payload_creates_event_and_action():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payment_id = f"pay_valid_test_{uuid.uuid4().hex[:8]}"
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": 250000,
                        "error_code": "BAD_REQUEST_PAYMENT_FAILED",
                        "error_description": "Payment failed due to insufficient funds in customer bank account",
                        "customer_id": "cust_rahul_123"
                    }
                }
            }
        }
        body_bytes = json.dumps(payload).encode("utf-8")
        valid_sig = compute_signature(body_bytes, settings.razorpay_webhook_secret)
        headers = {"X-Razorpay-Signature": valid_sig}

        response = await client.post("/webhooks/razorpay", content=body_bytes, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert "event_id" in data

        # Check Event in DB
        async with AsyncSessionLocal() as session:
            evt_res = await session.execute(select(Event).where(Event.razorpay_payment_id == payment_id))
            evt = evt_res.scalar_one_or_none()
            assert evt is not None
            assert evt.amount_paise == 250000

@pytest.mark.asyncio
async def test_webhook_idempotency_duplicate_ignored():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payment_id = f"pay_idempotent_{uuid.uuid4().hex[:8]}"
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": 100000,
                        "error_code": "BAD_REQUEST",
                        "error_description": "Insufficient balance"
                    }
                }
            }
        }
        body_bytes = json.dumps(payload).encode("utf-8")
        valid_sig = compute_signature(body_bytes, settings.razorpay_webhook_secret)
        headers = {"X-Razorpay-Signature": valid_sig}

        # First request
        res1 = await client.post("/webhooks/razorpay", content=body_bytes, headers=headers)
        assert res1.status_code == 200
        assert res1.json()["status"] == "processed"

        # Second duplicate request
        res2 = await client.post("/webhooks/razorpay", content=body_bytes, headers=headers)
        assert res2.status_code == 200
        assert res2.json()["status"] == "duplicate_ignored"

        # Verify only 1 row exists in DB
        async with AsyncSessionLocal() as session:
            count_res = await session.execute(
                select(func.count()).select_from(Event).where(Event.razorpay_payment_id == payment_id)
            )
            assert count_res.scalar() == 1
