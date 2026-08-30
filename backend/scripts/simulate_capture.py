import hmac
import hashlib
import json
import httpx
import asyncio
from app.main import app
from app.config import settings

async def main():
    secret = settings.razorpay_webhook_secret
    payload = {
        "entity": "event",
        "account_id": "acc_test",
        "event": "payment.captured",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_TVnGDxoTQ44mm8",
                    "amount": 222200,
                    "currency": "INR",
                    "status": "captured",
                    "order_id": "order_test_003",
                    "customer_id": "cust_8238012515"
                }
            }
        }
    }
    raw_body = json.dumps(payload).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": sig
    }

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/webhooks/razorpay", content=raw_body, headers=headers)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.json()}")

if __name__ == "__main__":
    asyncio.run(main())
