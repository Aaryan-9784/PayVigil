<div align="center">

# 🛡️ Autonomous AI Revenue Recovery Agent for Razorpay

**An enterprise-grade, real-time payment failure triage and autonomous revenue recovery pipeline powered by Multi-Provider AI Orchestration (Google Gemini / Groq Cloud / Built-in Heuristics), Dynamic Guardrails, and Full Role-Based Authentication & Portal Access.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4.svg?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Groq Cloud](https://img.shields.io/badge/AI-Groq_Cloud-F55036.svg)](https://groq.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2340.svg?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Tests](https://img.shields.io/badge/Tests-43%2F43%20Passed-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

[Features](#-key-features) • [Architecture](#-system-architecture--workflow) • [Authentication & Roles](#-authentication--role-based-access-control-rbac) • [24 Recovery Scenarios](#-24-triage-scenarios--recovery-actions) • [Guardrails](#-financial-guardrails--safety-rules) • [Quick Start](#-getting-started) • [API Reference](#-api-reference) • [Testing](#-testing--quality-assurance)

</div>

---

## 📖 Overview

In modern e-commerce and SaaS subscription billing, **failed payments account for 9% to 14% of lost gross merchandise value (GMV)**. While some failures represent permanent fraud or account termination, the vast majority are recoverable issues (transient bank gateway timeouts, momentary low balance, expired card updates, 3DS authentication drops, or network latency).

The **AI Revenue Recovery Agent** acts as an autonomous intelligent intermediary between your **Razorpay Gateway** and your customers. It ingests raw `payment.failed` webhooks, diagnoses root causes in milliseconds across a 3-tier AI cascade, and executes precise automated recovery actions (smart retries, bilingual recovery emails in English and Hinglish, and human escalations) while strictly enforcing enterprise financial guardrails.

---

## ✨ Key Features

- ⚡ **Zero-Trust Webhook Ingestion**: Validates raw request payload bytes using cryptographic **HMAC-SHA256** signatures before parsing or database persistence.
- 🔁 **Strict Payment Idempotency**: Atomic tracking of `razorpay_payment_id` prevents duplicate webhook deliveries from triggering redundant recovery operations or charges.
- 🔐 **Enterprise Authentication & RBAC**:
  - **Email & Password Authentication**: Secure sign-in and sign-up with PBKDF2-HMAC-SHA256 password hashing and RFC 7519 Bearer tokens.
  - **🛡️ System Administrator**: Full system telemetry, configuration controls, and passkey-protected database purge capabilities (Permanently configured for `aaryanpatel9784@gmail.com`).
  - **🎧 Customer Support Team**: Triage inspection, customer recovery communication, and live audit tracking (**Default role for all newly registered accounts**).
  - **🔑 3-Step OTP Password Reset**: Automated forgot-password workflow with OTP verification and secure credential rotation.
  - **⚡ Live Hot-Reloadable Passkeys**: Update admin/support passkeys in `.env` with instant runtime detection and zero server downtime.
- 🧠 **Multi-Tiered AI Triage Pipeline**:
  - **Primary**: Google Gemini (`gemini-2.5-flash` / `gemini-1.5-flash` via `google-genai`).
  - **Secondary**: Groq Cloud (`llama-3.3-70b-versatile`).
  - **Zero-Dependency Fallback**: Built-in deterministic rule engine that runs completely offline with **zero external API keys required**.
- 📋 **24 Comprehensive Failure Recovery Scenarios**:
  - Pre-calibrated coverage for bank timeouts, insufficient funds, expired cards, 3DS drops, international card blocks, UPI PIN failures, velocity limits, recurring mandate drops, suspected fraud, and chargeback disputes.
- 💬 **Bilingual Customer Recovery Communication**:
  - Automated generation and dispatch of contextual recovery emails and messages in both **English** and **Hinglish** tailored to the exact failure root cause.
- 🛡️ **Autonomous Financial Guardrails & Stopping Rules**:
  - **Max Retry Threshold**: Caps retries at $\ge 3$ per transaction before escalating to human support.
  - **Cooldown Window**: Enforces configurable delays (12h/15m) to avoid customer friction and bank throttles.
- 🔒 **Enterprise Data Protection**:
  - **AES-256 Field Encryption**: Customer PII (emails, cards, phones) encrypted before storage and masked before AI processing.
  - **Zero Plaintext Persistence**: Passwords and sensitive keys are never saved in local storage or client state.
- 📊 **Real-Time Financial Dashboard**:
  - Live revenue KPIs: **Total Recovered (₹)**, **Total At-Risk (₹)**, and **Recovery Success Rate (%)**.
  - Interactive Action Breakdown (Smart Retries, Customer Emails, Escalations, Policy Skips).
  - Live Event Feed via WebSockets and searchable, filterable **Audit Trail Log**.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Ingestion["1. Secure Ingestion Layer"]
        A[Razorpay Gateway] -->|POST payment.failed Webhook| B[FastAPI Webhook Ingestion]
        B --> C{Verify HMAC-SHA256 Signature}
        C -- Invalid Signature --> D[401 Unauthorized / Reject]
        C -- Valid Signature --> E{Idempotency Check}
        E -- Duplicate Payment ID --> F[200 OK - Duplicate Suppressed]
        E -- Fresh Event --> G[(Store in PostgreSQL: events)]
    end

    subgraph AI["2. Multi-Provider AI Triage"]
        G --> H[AI Triage Orchestrator]
        H -->|Attempt 1| I[Google Gemini API]
        I -- Timeout / Fail / No Key --> J[Groq Llama-3.3-70B]
        J -- Timeout / Fail / No Key --> K[Built-in Heuristic Engine]
        I --> L[Standardized JSON Diagnosis]
        J --> L
        K --> L
        L --> M[(Store in PostgreSQL: diagnoses)]
    end

    subgraph Guardrails["3. Safety Guardrails & Policy Checks"]
        M --> N{Attempt >= Max Retry Limit?}
        N -- Yes (>=3 Retries) --> O[Force Human Escalation]
        N -- No --> P{Within Cooldown Window?}
        P -- Yes (< 12h) --> Q[Mark 'skipped_stopping_rule']
        P -- No --> R[Proceed with Action]
    end

    subgraph Execution["4. Action Dispatcher & Audit Log"]
        R --> S{Determined Action Type}
        S -- Transient Failure --> T[Action: retry_payment on Razorpay]
        S -- Customer Action Needed --> U[Action: send_reminder_email via Resend]
        S -- High Risk / Fraud --> V[Action: escalate_to_human via Slack]
        O --> V

        T --> W[(Save to: actions)]
        U --> W
        V --> W
        Q --> W
        W --> X[(Save to: audit_log)]
    end

    subgraph UI["5. Role-Protected Dashboard"]
        X --> Y[React 18 + Vite Frontend Dashboard]
        Y --> Z[Live Metric Cards, Analytics & Audit Inspector]
    end
```

---

## 👥 Authentication & Role-Based Access Control (RBAC)

The portal provides secure Email & Password authentication with full RBAC isolation:

| Role | Default User / Target | Access Scope | Protected Capabilities |
| :--- | :--- | :--- | :--- |
| **🛡️ System Admin** | `aaryanpatel9784@gmail.com` | Full administrative control, API telemetry, database purge | Audit log purge via `ADMIN_PASSKEY`, system configuration, user role promotions |
| **🎧 Customer Support** | *All newly registered accounts (`support`)* | Payment failure triage, audit log stream, customer recovery messaging | View audit logs, trigger simulated webhooks, customer outreach |

### Authentication Capabilities:
1. **User Sign Up**: New users create accounts using **Email & Password**. All self-registered accounts are automatically assigned the **`support` (Customer Support)** role by default.
2. **User Sign In**: Authenticates using verified credentials with JWT session token issuance.
3. **Forgot Password Workflow**:
   - **Step 1: Request OTP**: User enters email to generate a secure 6-digit verification code.
   - **Step 2: Verify Code**: Submits OTP for time-bound validation (15-minute expiry).
   - **Step 3: Reset Password**: Securely updates password and clears the active reset token.
4. **Passkey Authorization**:
   - High-impact operations (such as purging audit logs) require real-time passkey confirmation configured in `.env`.

---

## 🎯 24 Triage Scenarios & Recovery Actions

The engine includes pre-calibrated diagnostic patterns for 24 real-world payment failure categories:

| # | Root Cause Category | Razorpay Failure Code | Recovery Action | Primary Channel |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Insufficient Funds** | `INSUFFICIENT_FUNDS` / `LOW_BALANCE` | **Smart Retry** | Scheduled retry during optimal clearing hours |
| 2 | **Expired Card** | `BAD_REQUEST_PAYMENT_CARD_EXPIRED` | **Reminder Email** | Bilingual update email with card link |
| 3 | **3DS Authentication Failure** | `BAD_REQUEST_PAYMENT_OTP_INCORRECT` | **Reminder Email** | Instant 1-click retry payment link |
| 4 | **Bank Gateway Timeout** | `GATEWAY_TIMEOUT` / `BANK_UNAVAILABLE` | **Smart Retry** | Exponential backoff gateway retry |
| 5 | **International Card Blocked** | `INTERNATIONAL_TRANSACTIONS_NOT_SUPPORTED` | **Reminder Email** | Currency & international enablement guide |
| 6 | **Invalid Card Number / Details** | `INVALID_CARD_NUMBER` / `BAD_REQUEST_CARD` | **Reminder Email** | Card detail re-entry link |
| 7 | **Invalid CVV** | `INVALID_CVV` / `CVV_VERIFICATION_FAILED` | **Reminder Email** | Security code verification notice |
| 8 | **Exceeded Transaction Limit** | `TRANSACTION_LIMIT_EXCEEDED` | **Reminder Email** | NetBanking / alternate method recommendation |
| 9 | **Daily Velocity Limit** | `DAILY_LIMIT_EXCEEDED` | **Smart Retry** | Next-day scheduled retry execution |
| 10 | **Card Inactive / Dormant** | `CARD_INACTIVE` / `ACCOUNT_DORMANT` | **Reminder Email** | Alternate payment method suggestion |
| 11 | **Incorrect UPI PIN** | `UPI_INCORRECT_PIN` / `VPA_VALIDATION_FAILED` | **Reminder Email** | UPI app notification / payment link |
| 12 | **UPI Gateway Timed Out** | `UPI_GATEWAY_TIMEOUT` / `PSP_TIMED_OUT` | **Smart Retry** | 15-minute retry on alternate PSP |
| 13 | **NetBanking Session Expired** | `NETBANKING_SESSION_EXPIRED` | **Reminder Email** | Instant session recovery link |
| 14 | **Card Blocked by Issuing Bank** | `CARD_BLOCKED_BY_ISSUER` | **Reminder Email** | Bank customer care notification & alternate card prompt |
| 15 | **Suspected Fraud / Risk Anomaly**| `GATEWAY_ERROR_FRAUD_FLAGGED` | **Human Escalation** | Instant priority alert to Slack `#ops-escalations` |
| 16 | **Chargeback / Payment Dispute** | `PAYMENT_DISPUTE_RAISED` | **Human Escalation** | Support ticket & account lock notice |
| 17 | **Recurring Mandate Failed** | `AUTO_DEBIT_MANDATE_FAILED` | **Smart Retry** | 24-hour auto-mandate re-presentation |
| 18 | **Tokenization Failure** | `CARD_TOKENIZATION_ERROR` | **Reminder Email** | RBI compliant token update notice |
| 19 | **Wallet Balance Insufficient** | `WALLET_INSUFFICIENT_BALANCE` | **Reminder Email** | Top-up prompt & fallback card payment |
| 20 | **EMV 3DS Drop-off** | `3DS_AUTHENTICATION_TIMEOUT` | **Reminder Email** | Re-authentication payment link |
| 21 | **Cross-Border FX Restriction** | `FX_RESTRICTION_ERROR` | **Human Escalation** | Compliance review & customer outreach |
| 22 | **Merchant Risk Rule Block** | `MERCHANT_RISK_RULE_MATCHED` | **Human Escalation** | Fraud analyst manual review |
| 23 | **Excessive Retries ($\ge 3$)** | Repeated failures on same payment | **Human Escalation** | Automatic Guardrail safety escalation |
| 24 | **Temporary Network Drop** | `NETWORK_CONNECTION_DROPPED` | **Smart Retry** | Immediate 60-second retry |

---

## 🛡️ Financial Guardrails & Safety Rules

1. **Max Retry Ceiling (`MAX_RETRY_ATTEMPTS = 3`)**:
   - Caps repeated gateway retries to protect customer cards from fraud blocks, issuing bank locks, and merchant penalties.
   - Once total attempts reach the threshold, the transaction transitions automatically to human escalation.

2. **Cooldown Throttle (`RETRY_COOLDOWN_HOURS = 12` / `15m`)**:
   - Prevents aggressive retry bursts that degrade user experience and trigger gateway throttling.
   - Incoming failures inside the cooldown window are logged as `skipped_stopping_rule`.

3. **Cryptographic HMAC Verification**:
   - Uses `hmac.compare_digest` on the raw request byte stream against `RAZORPAY_WEBHOOK_SECRET` to prevent timing and tampering attacks.

---

## 💻 Tech Stack

<div align="center">

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | Asynchronous high-throughput Python API engine |
| **Database & ORM** | [SQLAlchemy 2.0 (Async)](https://www.sqlalchemy.org/) + [AsyncPG](https://github.com/MagicStack/asyncpg) | Non-blocking relational storage (PostgreSQL / Supabase / SQLite) |
| **Validation & Security** | [Pydantic v2](https://docs.pydantic.dev/) + Cryptography | Type-safe DTOs, AES-256 PII encryption & HMAC-SHA256 verification |
| **AI Triage Layer** | [Google Gemini](https://aistudio.google.com/) + [Groq Cloud](https://groq.com/) | Real-time multi-model diagnosis with local heuristic fallback |
| **Integrations** | [Razorpay SDK](https://razorpay.com/) • [Resend](https://resend.com/) • [Slack API](https://api.slack.com/) | Gateway retries, bilingual recovery emails, and team escalation alerts |
| **Frontend UI** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Tailwind CSS 3.4](https://tailwindcss.com/) | Modern glassmorphic SaaS dashboard with live telemetry |
| **Charts & Icons** | [Recharts](https://recharts.org/) + [Lucide React](https://lucide.dev/) | Financial recovery analytics and UI iconography |

</div>

---

## 📂 Project Directory Structure

```text
Razorpay/
├── .gitignore                      # Comprehensive Git ignore rules (Secrets, DBs, Node, Python, SSL)
├── README.md                       # Master system documentation
├── docker-compose.yml              # Container orchestration (FastAPI + PostgreSQL + n8n)
│
├── backend/
│   ├── Dockerfile                  # Production container recipe for FastAPI backend
│   ├── requirements.txt            # Python backend dependencies
│   ├── pytest.ini                  # Pytest test discovery configuration
│   ├── alembic.ini                 # Database migration config
│   ├── .env.example                # Backend environment configuration template
│   ├── scripts/
│   │   └── change_passkey.py       # Passkey rotation CLI utility
│   └── app/
│       ├── main.py                 # FastAPI application entrypoint, CORS & lifespan
│       ├── config.py               # Pydantic settings & real-time passkey loader
│       ├── database.py             # Async database connection and session management
│       ├── models.py               # SQLAlchemy ORM models (User, Event, Diagnosis, Action, AuditLog)
│       ├── schemas.py              # Pydantic DTO validation schemas
│       ├── security.py             # HMAC-SHA256 signatures, PBKDF2 hashing & AES-256 encryption
│       ├── ai_agent.py             # Multi-model AI triage engine (Gemini -> Groq -> Heuristics)
│       ├── executor.py             # Guardrail policy checks & action execution
│       ├── razorpay_client.py      # Razorpay payment retry and refund wrapper
│       ├── email_client.py         # Resend bilingual transactional email client
│       ├── messaging_client.py     # SMS & WhatsApp recovery notification client
│       ├── slack_client.py         # Slack webhook notification client
│       ├── ws_manager.py           # WebSocket manager for live event telemetry
│       ├── routes/
│       │   ├── webhooks.py         # Razorpay webhook ingestion endpoint
│       │   ├── dashboard.py        # Auth (Login/Signup/OTP), metrics & audit trail endpoints
│       │   ├── indian_recovery.py  # Regional UPI & NetBanking recovery endpoints
│       │   └── dev_tools.py        # Sandbox simulation & passkey-protected reset endpoints
│       └── tests/
│           ├── test_all_scenarios_validation.py      # Validates all 24 failure categories
│           ├── test_auth_rbac_and_forgot_password.py # Auth, RBAC, Signup & OTP reset tests
│           ├── test_webhooks.py                      # Signature & idempotency test cases
│           ├── test_executor.py                      # Guardrail rules & execution test cases
│           ├── test_claude_agent.py                  # AI diagnostic fallback tests
│           └── test_pure_python_flow.py              # End-to-end webhook-to-action flow tests
│
└── frontend/
    ├── package.json                # React frontend dependencies & scripts
    ├── vite.config.js              # Vite bundler configuration
    ├── tailwind.config.js          # Tailwind CSS theme & tokens
    ├── postcss.config.js           # PostCSS configuration
    ├── .env.example                # Frontend environment template
    └── src/
        ├── App.jsx                 # Dashboard root layout & auth-gated state orchestration
        ├── api.js                  # Axios client with base URL & auth headers
        ├── index.css               # Global styles & glassmorphic tokens
        ├── main.jsx                # React DOM entrypoint
        └── components/
            ├── LoginPage.jsx       # Email & Password login, Sign Up portal & OTP Forgot Password modal
            ├── Header.jsx          # Top navigation bar, brand logo & profile dropdown
            ├── SummaryCards.jsx    # Metric KPIs (₹ Recovered, ₹ At-Risk, Recovery Rate)
            ├── LiveEventFeed.jsx   # Real-time WebSocket event feed
            ├── BankHealthMatrix.jsx# Bank uptime and failure rate matrix
            ├── RecoveryChart.jsx   # Visual analytics (Bar & Area charts)
            ├── AuditTable.jsx      # Filterable, searchable audit log stream
            ├── ClearLogsModal.jsx  # Admin passkey authorization modal for database purge
            └── Footer.jsx          # Security indicators & system status
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: `3.10` or higher
- **Node.js**: `18.x` or higher (`npm` / `yarn` / `pnpm`)
- **Git**

---

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd Razorpay/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create or edit `backend/.env`:
   ```env
   # AI Provider Keys
   GEMINI_API_KEY=your_gemini_key_here
   GROQ_API_KEY=your_groq_key_here

   # Razorpay Credentials
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

   # Database Connection (PostgreSQL, Supabase or SQLite)
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/postgres

   # Security & Passkeys
   DASHBOARD_API_KEY=your_secure_api_key
   ADMIN_PASSKEY=YourAdminPasskey
   CUSTOMER_SUPPORT_PASSKEY=YourSupportPasskey
   JWT_SECRET_KEY=your_super_secret_jwt_key
   ```

5. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd Razorpay/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)** in your browser to access the application.

---

## 📡 API Reference

### Webhook Ingestion
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/webhooks/razorpay` | Receives raw `payment.failed` webhook payloads with HMAC signature verification |

### Authentication & User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates with Email & Password, returns JWT token and role |
| `POST` | `/api/auth/signup` | Registers new user (assigned `support` role by default) |
| `POST` | `/api/auth/forgot-password` | Initiates password reset and generates 6-digit OTP code |
| `POST` | `/api/auth/verify-reset-code` | Validates 6-digit OTP code against expiry |
| `POST` | `/api/auth/reset-password` | Updates password using validated OTP code |
| `POST` | `/api/auth/change-password` | Updates authenticated user password |
| `GET` | `/api/auth/me` | Fetches current user profile and role |

### Dashboard & Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregated recovery KPIs (Total Recovered, At Risk, Success Rate) |
| `GET` | `/api/dashboard/audit-logs` | Filterable, paginated audit trail with search and date filters |
| `GET` | `/api/dashboard/health` | System and AI provider health status |
| `DELETE`| `/api/dashboard/purge` | Admin passkey-protected audit log purge endpoint |
| `WS` | `/api/dashboard/ws` | WebSocket connection for real-time live event streaming |

---

## 🧪 Testing & Quality Assurance

Run the comprehensive automated test suite with `pytest`:

```bash
cd backend
.\venv\Scripts\pytest -v
```

### Complete Test Suite (43 / 43 Passed - 100% Pass Rate):
- ✅ `test_all_scenarios_validation.py` (24 Tests): Validates end-to-end recovery decisions across all 24 failure categories.
- ✅ `test_auth_rbac_and_forgot_password.py` (10 Tests): Validates Email/Password login, Sign Up role default (`support`), 3-step OTP forgot password, passkey verification, and token authentication.
- ✅ `test_webhooks.py` (4 Tests): Validates HMAC-SHA256 signature verification, rejection of forged signatures, and payment idempotency deduplication.
- ✅ `test_executor.py` (3 Tests): Validates Max Retry limit transitions ($\ge 3$), 12h cooldown window suppression, and execution logging.
- ✅ `test_claude_agent.py` (1 Test): Validates AI diagnostic consistency and deterministic fallback logic.
- ✅ `test_pure_python_flow.py` (1 Test): Validates complete synchronous webhook-to-action dispatch cycle.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for intelligent, autonomous fintech workflows.</sub>
</div>
