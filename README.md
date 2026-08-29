<div align="center">

# 🛡️ Autonomous AI Revenue Recovery Agent for Razorpay

**An enterprise-grade, real-time payment failure triage and revenue recovery pipeline powered by Multi-Provider AI Orchestration (Google Gemini / Groq Cloud / Built-in Heuristics) and Role-Based Portal Access.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4.svg?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Groq Cloud](https://img.shields.io/badge/AI-Groq_Cloud-F55036.svg)](https://groq.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2340.svg?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

[Features](#-key-features) • [Architecture](#-system-architecture--workflow) • [Role-Based Access](#-role-based-authentication--portal) • [Triage Engine](#-triage-branches--recovery-actions) • [Guardrails](#-financial-guardrails--safety-rules) • [Quick Start](#-getting-started) • [API Docs](#-api-reference) • [Testing](#-testing--quality-assurance)

</div>

---

## 📖 Overview

In modern e-commerce and SaaS billing, **failed payments account for 9% to 14% of lost gross merchandise value (GMV)**. While some failures are permanent (e.g., fraudulent cards, closed accounts), the vast majority are recoverable (e.g., transient bank gateway timeouts, temporary low balance, expired card updates, 3DS drop-offs).

The **AI Revenue Recovery Agent** acts as an autonomous intermediary between your **Razorpay Gateway** and your customers. It listens to raw `payment.failed` webhook streams, executes root cause diagnosis in milliseconds using a tiered AI cascade, and triggers precise automated recovery actions (smart retries, personalized bilingual customer emails in English and Hinglish, and human escalations) while enforcing strict financial safety guardrails.

---

## ✨ Key Features

- ⚡ **Zero-Trust Webhook Ingestion**: Validates raw request payload bytes using cryptographic **HMAC-SHA256** signatures before parsing or database persistence.
- 🔁 **Strict Payment Idempotency**: Atomic tracking of `razorpay_payment_id` prevents duplicate webhook deliveries from triggering redundant charges.
- 🔐 **Role-Based Portal Authentication**:
  - **🛡️ System Administrator**: Full system telemetry, configuration controls, and passkey-protected database purge capabilities.
  - **🎧 Customer Support Team**: Customer failure resolution, audit trail inspection, and bilingual recovery communication templates.
  - **⚡ Live Hot-Reloadable Passkeys**: Update passkeys in `.env` with instant detection and zero server reboots.
- 🧠 **Multi-Tiered AI Triage Pipeline**:
  - **Primary**: Google Gemini (`gemini-2.5-flash` / `gemini-1.5-flash` via `google-genai`).
  - **Secondary**: Groq Cloud (`llama-3.3-70b-versatile`).
  - **Zero-Dependency Fallback**: Built-in deterministic rule engine that runs completely offline with **zero external API keys required**.
- 💬 **Bilingual Customer Communication**:
  - Automated generation of professional recovery emails in both **English** and **Hinglish** tailored to the specific failure root cause.
- 🛡️ **Autonomous Guardrails & Stopping Rules**:
  - **Max Retry Threshold**: Caps retries at $\ge 3$ per transaction before escalating to human support.
  - **Cooldown Window**: Enforces a configurable delay (default: 12h) to avoid customer friction and bank throttles.
- 🔒 **Enterprise Data Protection**:
  - **AES-256 Field Encryption**: Customer PII (emails, cards, phones) encrypted before storage and masked before AI processing.
  - **Zero Plaintext Persistence**: Plaintext credentials are never saved in local storage or client state.
- 📊 **Real-Time Financial Dashboard**:
  - Live revenue KPIs: **Total Recovered (₹)**, **Total At-Risk (₹)**, and **Recovery Success Rate (%)**.
  - Interactive Action Breakdown (Smart Retries, Customer Emails, Escalations, Policy Skips).
  - Searchable, filterable **Audit Trail Log**.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Ingestion["1. Secure Ingestion Layer"]
        A[Razorpay Gateway] -->|POST payment.failed Webhook| B[FastAPI Webhook Handler]
        B --> C{Verify HMAC-SHA256 Signature}
        C -- Invalid Signature --> D[401 Unauthorized / Reject]
        C -- Valid Signature --> E{Idempotency Check}
        E -- Duplicate Payment ID --> F[200 OK - Duplicate Ignored]
        E -- Fresh Event --> G[(Store in PostgreSQL: events)]
    end

    subgraph AI["2. Multi-Provider AI Diagnosis"]
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

## 👥 Role-Based Authentication & Portal

The application gates dashboard telemetry behind a **Dark Glassmorphic Authentication Screen**:

| Role | Default Identifier | Access Scope | Protected Actions |
| :--- | :--- | :--- | :--- |
| **🛡️ System Admin** | `Administrator` | Full administrative control, API telemetry, database purge | Authorized to purge audit logs via `ADMIN_PASSKEY` |
| **🎧 Customer Support** | `Support Agent` | Payment failure triage, audit log stream, customer recovery messaging | Can view logs and initiate purge (requires Admin Passkey) |

### Real-Time Passkey Configuration (`backend/.env`):
```env
# Dashboard Security & Role Access Controls
ADMIN_PASSKEY=YourCustomAdminPasskey!2026
CUSTOMER_SUPPORT_PASSKEY=YourCustomSupportPasskey!2026
```
*Passkeys hot-reload dynamically on save without restarting the Uvicorn server.*

---

## 🎯 Triage Branches & Recovery Actions

```
                                    ┌──► 1. Smart Retry (Transient bank timeouts, insufficient funds)
Incoming payment.failed Webhook ────┼──► 2. Reminder Email (Expired card, 3DS authentication failure, CVV)
                                    └──► 3. Human Escalation (Suspected fraud, chargeback dispute, limit exceeded)
```

| Scenario | Razorpay Error Code / Description | Recovery Branch | Automated Dispatch Channel |
| :--- | :--- | :--- | :--- |
| **Bank Timeout / Gateway Drop** | `GATEWAY_TIMEOUT`<br>`BAD_REQUEST_PAYMENT_FAILED` | **Smart Retry** | Scheduled retry via Razorpay API |
| **Insufficient Funds** | `INSUFFICIENT_FUNDS`<br>`LOW_BALANCE` | **Smart Retry** | Delayed retry (optimal clearing window) |
| **Expired Card / Invalid Card** | `BAD_REQUEST_PAYMENT_CARD_EXPIRED` | **Reminder Email** | Customer email via **Resend** with card update portal |
| **3DS Authentication Drop** | `BAD_REQUEST_PAYMENT_OTP_INCORRECT`<br>`AUTH_FAILED` | **Reminder Email** | Instant 1-click retry payment link |
| **Suspected Fraud / Risk Anomaly**| `GATEWAY_ERROR_FRAUD_FLAGGED` | **Human Escalation** | Instant alert to **Slack** `#ops-escalations` |
| **Chargeback / Dispute** | `PAYMENT_DISPUTE_RAISED` | **Human Escalation** | Support ticket creation & Slack alert |
| **Excessive Retries ($\ge 3$)** | Any failure repeated $\ge 3$ times | **Human Escalation** | Automatic Guardrail safety escalation |

---

## 🛡️ Financial Guardrails & Safety Rules

1. **Max Retry Ceiling (`MAX_RETRY_ATTEMPTS = 3`)**:
   - Caps repeated gateway retries to prevent bank fraud blocks, card locking, and merchant penalty fees.
   - Once total attempts reach the threshold, the system routes the transaction directly to human operators.

2. **Cooldown Throttle (`RETRY_COOLDOWN_HOURS = 12`)**:
   - Multiple rapid retries irritate customers and trigger gateway rate limits.
   - If a new failure arrives within the cooldown window for the same payment, the event is marked `skipped_stopping_rule`.

3. **Cryptographic Webhook Verification**:
   - Uses `hmac.compare_digest` on the raw request byte stream against `RAZORPAY_WEBHOOK_SECRET` to prevent timing attacks.

---

## 💻 Tech Stack

<div align="center">

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | High-performance asynchronous Python web framework |
| **Database & ORM** | [SQLAlchemy 2.0 (Async)](https://www.sqlalchemy.org/) + [AsyncPG](https://github.com/MagicStack/asyncpg) | Async relational database layer (PostgreSQL / Supabase) |
| **Validation & Config** | [Pydantic v2](https://docs.pydantic.dev/) + `pydantic-settings` | Schema validation, type safety, and environment hot-reloading |
| **AI Triage Layer** | [Google Gemini](https://aistudio.google.com/) + [Groq Cloud](https://groq.com/) | LLM diagnosis with automatic fallback to local heuristic engine |
| **Integrations** | [Razorpay SDK](https://razorpay.com/) • [Resend](https://resend.com/) • [Slack API](https://api.slack.com/) | Payment operations, transactional emails, and team escalation |
| **Frontend UI** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Tailwind CSS 3.4](https://tailwindcss.com/) | Responsive dark glassmorphic fintech dashboard |
| **Data Viz & Icons** | [Recharts](https://recharts.org/) + [Lucide React](https://lucide.dev/) | Financial recovery charts and UI iconography |

</div>

---

## 📂 Project Directory Structure

```text
Razorpay/
├── .gitignore                      # Production Git ignore rules (Secrets, DBs, Node, Python)
├── README.md                       # Comprehensive project documentation
├── docker-compose.yml              # Multi-container orchestration (FastAPI + PostgreSQL + n8n)
│
├── backend/
│   ├── Dockerfile                  # Production container recipe for FastAPI backend
│   ├── requirements.txt            # Python backend dependencies
│   ├── pytest.ini                  # Pytest test discovery configuration
│   ├── alembic.ini                 # Database migration config
│   ├── .env.example                # Backend environment template
│   └── app/
│       ├── main.py                 # FastAPI application entrypoint, CORS & lifespan
│       ├── config.py               # Pydantic settings & real-time passkey loader
│       ├── database.py             # Async database connection and session management
│       ├── models.py               # SQLAlchemy ORM models (Event, Diagnosis, Action, AuditLog)
│       ├── schemas.py              # Pydantic DTO schemas
│       ├── security.py             # Cryptographic HMAC-SHA256 signature verification & AES-256
│       ├── ai_agent.py             # Multi-model AI triage engine (Gemini -> Groq -> Heuristics)
│       ├── executor.py             # Guardrail policy checks & action execution
│       ├── razorpay_client.py      # Razorpay payment retry and refund wrapper
│       ├── email_client.py         # Resend transactional email client
│       ├── slack_client.py         # Slack webhook notification client
│       ├── routes/
│       │   ├── webhooks.py         # Production Razorpay webhook ingestion endpoint
│       │   ├── dashboard.py        # Analytics aggregation, auth & audit trail endpoints
│       │   └── dev_tools.py        # Sandbox simulation & passkey-protected reset endpoints
│       └── tests/
│           ├── test_webhooks.py    # Signature & idempotency test cases
│           ├── test_executor.py    # Guardrail rules & execution test cases
│           ├── test_claude_agent.py# AI diagnostic fallback tests
│           └── test_pure_python_flow.py # End-to-end webhook-to-action flow tests
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
            ├── LoginPage.jsx       # Dark glassmorphic portal entry screen
            ├── Header.jsx          # Top navigation bar, brand logo & profile dropdown
            ├── SummaryCards.jsx    # Metric KPIs (₹ Recovered, ₹ At-Risk, Recovery Rate)
            ├── RecoveryChart.jsx   # Visual analytics (Bar & Area charts)
            ├── AuditTable.jsx      # Filterable, searchable audit log stream
            ├── ClearLogsModal.jsx  # Admin passkey authorization modal for database purge
            └── Footer.jsx          # Footer & security indicators
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
   GEMINI_API_KEY=your_gemini_key_here
   GROQ_API_KEY=your_groq_key_here
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/postgres
   DASHBOARD_API_KEY=your_secure_api_key
   ADMIN_PASSKEY=YourAdminPasskey
   CUSTOMER_SUPPORT_PASSKEY=YourSupportPasskey
   ```

5. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd Razorpay/frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)** in your browser to access the application.

---

## 🧪 Testing & Quality Assurance

Run the comprehensive automated test suite with `pytest`:

```bash
cd backend
.\venv\Scripts\pytest -v
```

### Test Coverage:
- ✅ `test_webhooks.py`: Verifies valid and invalid HMAC-SHA256 signature rejections and idempotency deduplication.
- ✅ `test_executor.py`: Validates maximum retry count transitions ($\ge 3$), cooldown interval skip logic, and database state.
- ✅ `test_claude_agent.py`: Validates heuristic and LLM decision consistency across failure codes.
- ✅ `test_pure_python_flow.py`: Tests the entire webhook ingestion to diagnosis and action execution flow.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for intelligent, autonomous fintech workflows.</sub>
</div>
