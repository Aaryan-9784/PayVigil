import pytest
import hmac
import hashlib
import json
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings

def _generate_signature(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

@pytest.mark.asyncio
async def test_flow_branch_retry():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_flow_retry_001",
                        "amount": 250000,
                        "error_code": "BAD_REQUEST_PAYMENT_TIMED_OUT",
                        "error_description": "Bank network connection timed out",
                        "customer_id": "cust_flow_retry"
                    }
                }
            }
        }
        body = json.dumps(payload).encode()
        sig = _generate_signature(body, settings.razorpay_webhook_secret)
        
        response = await ac.post(
            "/webhooks/razorpay",
            content=body,
            headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["decision"] == "retry_payment"

@pytest.mark.asyncio
async def test_flow_branch_message():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_flow_msg_002",
                        "amount": 100000,
                        "error_code": "BAD_REQUEST_PAYMENT_CARD_EXPIRED",
                        "error_description": "Customer card expired. Please update billing method.",
                        "customer_id": "cust_flow_msg"
                    }
                }
            }
        }
        body = json.dumps(payload).encode()
        sig = _generate_signature(body, settings.razorpay_webhook_secret)
        
        response = await ac.post(
            "/webhooks/razorpay",
            content=body,
            headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["decision"] == "send_reminder_email"

@pytest.mark.asyncio
async def test_flow_branch_human():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_flow_human_003",
                        "amount": 25000000,
                        "error_code": "GATEWAY_ERROR_SUSPECTED_FRAUD",
                        "error_description": "High value payment flagged for suspected fraud dispute",
                        "customer_id": "cust_flow_fraud"
                    }
                }
            }
        }
        body = json.dumps(payload).encode()
        sig = _generate_signature(body, settings.razorpay_webhook_secret)
        
        response = await ac.post(
            "/webhooks/razorpay",
            content=body,
            headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["decision"] == "escalate_to_human"
