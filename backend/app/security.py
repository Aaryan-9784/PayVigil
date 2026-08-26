import hmac
import hashlib
from fastapi import HTTPException

def verify_razorpay_signature(body: bytes, signature: str, secret: str) -> None:
    """Raises HTTPException(400) if the signature does not match.
    CRITICAL: must use the RAW request body bytes, not a re-serialized JSON dict,
    or the signature will never match even for legitimate requests."""
    if not signature or not secret:
        raise HTTPException(status_code=400, detail="Missing webhook signature or secret")

    expected = hmac.new(
        key=secret.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
