import pytest
from app.models import Event
from app.ai_agent import diagnose_and_decide
from app.routes.dev_tools import SCENARIOS

@pytest.mark.asyncio
@pytest.mark.parametrize("scenario_key,scenario_data", list(SCENARIOS.items()))
async def test_all_scenarios_resolve_correctly(scenario_key, scenario_data):
    """
    Validates that every single real-world Indian and industry payment scenario
    resolves cleanly to its expected action with valid input parameters.
    """
    event = Event(
        razorpay_payment_id=f"pay_val_{scenario_key[:12]}",
        amount_paise=499900 if "vip" not in scenario_key and "edtech" not in scenario_key else 5500000,
        error_code=scenario_data["error_code"],
        error_description=scenario_data["error_description"],
        customer_id="cust_test_validation_user",
        raw_payload={}
    )
    decision = await diagnose_and_decide(event)
    
    # 1. Action must match expected action
    assert decision["action"] == scenario_data["expected_action"], (
        f"Scenario '{scenario_key}' failed: expected '{scenario_data['expected_action']}', got '{decision['action']}'"
    )
    
    # 2. Input dict must exist and be valid
    assert "input" in decision and isinstance(decision["input"], dict)
    
    # 3. Required keys per action
    if decision["action"] == "retry_payment":
        assert "razorpay_payment_id" in decision["input"]
    elif decision["action"] == "send_reminder_email":
        assert "customer_id" in decision["input"]
    elif decision["action"] == "escalate_to_human":
        assert "razorpay_payment_id" in decision["input"] or "reason" in decision["input"]
