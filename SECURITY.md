# 🛡️ PayVigil Security Policy & Standards

PayVigil is engineered with a **Zero-Trust Financial Architecture** to safeguard sensitive payment data, prevent webhook tampering, and enforce strict regulatory compliance (RBI / PCI-DSS guidelines).

---

## 🔒 Security Architecture Highlights

### 1. Webhook Signature Verification (HMAC-SHA256)
- Every incoming webhook from Razorpay is cryptographically validated using `hmac.compare_digest` against `RAZORPAY_WEBHOOK_SECRET`.
- Non-matching or missing signatures are immediately rejected with `400 Bad Request` prior to any execution or parsing.

### 2. PII Encryption at Rest (AES-128-CBC)
- Customer personal identifiers (email addresses, phone numbers) are stored encrypted at rest with AES-128-CBC prefixed with `enc::`.
- Display layers apply strict masking (e.g. `a***l@domain.com`, `+91 ******1234`) to comply with data privacy standards.

### 3. Password Hashing & Secret Protection (PBKDF2-HMAC-SHA256)
- All user passwords are encrypted using PBKDF2 with 100,000 iterations and unique cryptographic salts.
- Admin passkeys and API secrets are never logged in plaintext or exposed over unauthenticated endpoints.

### 4. Financial Guardrails & Replay Protection
- **Idempotency Deduplication**: Duplicate webhook event IDs are automatically detected and suppressed.
- **Max Retry Ceiling**: Capped at 3 automatic retry attempts per payment ID to prevent bank-side card lockouts.
- **12-Hour Cooldown Window**: Enforces quiet windows between non-critical outreach attempts.

---

## 🚨 Reporting a Security Vulnerability

If you discover a potential security vulnerability within PayVigil, please report it promptly:

1. **Email**: Send detailed information to the security team at **`aaryanpatel9784@gmail.com`**.
2. **Details to Include**:
   - Description of the vulnerability and attack vector
   - Steps to reproduce or proof-of-concept (PoC) code
   - Potential impact on merchant data or transactions
3. **Disclosure Policy**:
   - We ask that you do not disclose any vulnerability publicly until a fix has been published.
   - We will acknowledge receipt of your report within 24 hours and provide regular status updates.

Thank you for helping keep PayVigil safe for all merchants and buyers!
