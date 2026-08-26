import pytest
from app.models import Event
from app.ai_agent import diagnose_and_decide, TOOLS

@pytest.mark.asyncio
async def test_diagnose_insufficient_funds_returns_retry_payment():
    event = Event(
        razorpay_payment_id="pay_test_retry_001",
        amount_paise=499900,
        error_code="BAD_REQUEST_PAYMENT_FAILED",
        error_description="Payment failed due to insufficient funds in customer bank account",
        customer_id="cust_user_01",
        raw_payload={}
    )
    decision = await diagnose_and_decide(event)
    assert decision["action"] == "retry_payment"
    assert "razorpay_payment_id" in decision["input"]

@pytest.mark.asyncio
async def test_diagnose_expired_card_returns_send_reminder_email():
    event = Event(
        razorpay_payment_id="pay_test_email_002",
        amount_paise=299900,
        error_code="BAD_REQUEST_PAYMENT_CARD_EXPIRED",
        error_description="The customer card has expired. Customer must update payment details.",
        customer_id="cust_user_02",
        raw_payload={}
    )
    decision = await diagnose_and_decide(event)
    assert decision["action"] == "send_reminder_email"
    assert "customer_id" in decision["input"]

@pytest.mark.asyncio
async def test_diagnose_fraud_returns_escalate_to_human():
    event = Event(
        razorpay_payment_id="pay_test_escalate_003",
        amount_paise=15000000,
        error_code="GATEWAY_ERROR_FRAUD_FLAGGED",
        error_description="Transaction flagged by risk management engine for suspected fraud and dispute anomaly",
        customer_id="cust_user_03",
        raw_payload={}
    )
    decision = await diagnose_and_decide(event)
    assert decision["action"] == "escalate_to_human"
    assert "reason" in decision["input"]

def test_claude_tools_schema_definition():
    tool_names = [t["name"] for t in TOOLS]
    assert "retry_payment" in tool_names
    assert "send_reminder_email" in tool_names
    assert "escalate_to_human" in tool_names
    assert len(tool_names) == 3
