from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DashboardSummaryResponse(BaseModel):
    total_recovered_paise: int
    total_at_risk_paise: int
    recovery_rate_pct: float
    total_actions: int = 0
    successful_actions: int = 0
    recent_audit_log: List[Dict[str, Any]]

class WebhookResponse(BaseModel):
    status: str
    event_id: Optional[str] = None
    reason: Optional[str] = None

class DevSimulatePaymentRequest(BaseModel):
    scenario: str = Field(..., description="insufficient_funds | expired_card | fraud | bank_timeout | max_retries_exceeded | cooldown_violation")
    amount_paise: Optional[int] = 499900  # Default ₹4,999
    customer_id: Optional[str] = "cust_vip_98765"
    custom_payment_id: Optional[str] = None
    mock_claude_response: Optional[str] = None
