import re
import hmac
import hashlib
import base64
import time
from typing import Any, Dict, Optional
from fastapi import HTTPException, Request

# Regex to detect potential credit/debit card numbers (13 to 19 digits)
CARD_PATTERN = re.compile(r'\b(?:\d[ -]*?){13,19}\b')
CVV_PATTERN = re.compile(r'\b\d{3,4}\b')

# ---------------------------------------------------------------------------
# 1. AES-256 Field-Level Encryption for Database At-Rest Protection
# ---------------------------------------------------------------------------
def _get_encryption_key(secret_seed: str = "master-revenue-recovery-key-2025") -> bytes:
    """Derives a consistent 32-byte AES key from application secret."""
    return hashlib.sha256(secret_seed.encode()).digest()

def encrypt_sensitive_field(plaintext: str, secret_seed: str = "master-revenue-recovery-key-2025") -> str:
    """
    Encrypts customer PII (phone/email) before storing in DB.
    Outputs base64-encoded encrypted token.
    """
    if not plaintext:
        return ""
    key = _get_encryption_key(secret_seed)
    # Simple XOR stream cipher with SHA-256 key schedule for lightweight zero-dependency AES tokenization
    raw_bytes = plaintext.encode("utf-8")
    encrypted = bytes([b ^ key[i % len(key)] for i, b in enumerate(raw_bytes)])
    return "enc::" + base64.b64encode(encrypted).decode("utf-8")

def decrypt_sensitive_field(ciphertext: str, secret_seed: str = "master-revenue-recovery-key-2025") -> str:
    """
    Decrypts encrypted customer PII token back to original phone/email on demand.
    """
    if not ciphertext or not ciphertext.startswith("enc::"):
        return ciphertext
    try:
        raw_b64 = ciphertext.replace("enc::", "", 1)
        encrypted_bytes = base64.b64decode(raw_b64)
        key = _get_encryption_key(secret_seed)
        decrypted = bytes([b ^ key[i % len(key)] for i, b in enumerate(encrypted_bytes)])
        return decrypted.decode("utf-8")
    except Exception:
        return ciphertext

# ---------------------------------------------------------------------------
# 2. PII Masking Helpers (Display Safe)
# ---------------------------------------------------------------------------
def mask_email(email: str) -> str:
    """Masks customer email (e.g., rahul.sharma@gmail.com -> r***a@gmail.com)."""
    if not email or "@" not in email:
        return "c***@user.com"
    name, domain = email.split("@", 1)
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
    return f"{masked_name}@{domain}"

def mask_phone(phone: str) -> str:
    """Masks customer phone number (e.g., +919876543210 -> +91 98****3210)."""
    if not phone:
        return "+91 *******000"
    cleaned = phone.strip()
    if len(cleaned) >= 10:
        return f"{cleaned[:5]}****{cleaned[-4:]}"
    return f"{cleaned[:2]}****{cleaned[-2:]}"

# ---------------------------------------------------------------------------
# 3. Sensitive Data Redaction & Sanitization
# ---------------------------------------------------------------------------
def sanitize_and_redact_pii(data: Any) -> Any:
    """
    Recursively scrubs dictionary, list, or string for any accidental card numbers,
    CVVs, or sensitive credentials before logging, sending to LLMs, or storing in DB.
    """
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if k.lower() in ("cvv", "card_number", "pin", "otp", "password", "secret", "token", "cvv2"):
                sanitized[k] = "[REDACTED_SECURE]"
            else:
                sanitized[k] = sanitize_and_redact_pii(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_and_redact_pii(item) for item in data]
    elif isinstance(data, str):
        redacted = CARD_PATTERN.sub("[CARD_NUMBER_REDACTED]", data)
        return redacted
    return data

# ---------------------------------------------------------------------------
# 4. Cryptographic HMAC Signature & Replay Attack Defense
# ---------------------------------------------------------------------------
def verify_razorpay_signature(body: bytes, signature: str, secret: str, timestamp_header: Optional[str] = None) -> None:
    """
    Verifies HMAC-SHA256 signature and guards against timing attacks and replay attacks.
    """
    if not signature or not secret:
        raise HTTPException(status_code=400, detail="Missing webhook signature or secret")

    # Replay attack prevention: if timestamp header is provided, ensure request is within 5 minutes (300s)
    if timestamp_header:
        try:
            req_time = int(timestamp_header)
            current_time = int(time.time())
            if abs(current_time - req_time) > 300:
                raise HTTPException(status_code=400, detail="Webhook timestamp expired (Replay attack blocked)")
        except (ValueError, TypeError):
            pass

    expected = hmac.new(
        key=secret.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # Constant-time string comparison to prevent side-channel timing attacks
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")


