<div align="center">

# 🛡️ Autonomous AI Revenue Recovery Agent for Razorpay

**An enterprise-grade, real-time payment failure triage and revenue recovery pipeline powered by Multi-Provider AI Orchestration (Google Gemini / Groq Cloud / Built-in Heuristics).**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4.svg?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Groq Cloud](https://img.shields.io/badge/AI-Groq_Cloud-F55036.svg)](https://groq.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2340.svg?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

[Features](#-key-features) • [Architecture](#-system-architecture--workflow) • [Triage Engine](#-triage-branches--recovery-actions) • [Guardrails](#-financial-guardrails--safety-rules) • [Quick Start](#-getting-started) • [API Docs](#-api-reference) • [Testing](#-testing--quality-assurance)

</div>

---

## 📖 Overview

In modern e-commerce and SaaS subscriptions, **failed payments account for up to 9-14% of lost gross merchandise value (GMV)**. While some failures are permanent (e.g., fraudulent cards, closed accounts), a large majority are recoverable (e.g., transient bank gateway timeouts, temporary low balance, expired card updates, 3DS drop-offs).

The **AI Revenue Recovery Agent** autonomously acts as an intelligent intermediary between your **Razorpay Gateway** and your customers. It listens to raw `payment.failed` webhook streams, performs root cause diagnosis in milliseconds using a tiered AI cascade, and executes precise, automated recovery workflows while strictly enforcing financial safety guardrails.

---

## ✨ Key Features

- ⚡ **Zero-Trust Webhook Ingestion**: Validates raw request payload bytes using cryptographic **HMAC-SHA256** signatures before parsing or touching the database.
- 🔁 **Strict Payment Idempotency**: Atomic tracking of `razorpay_payment_id` ensures duplicate or retried webhooks never cause duplicate actions or charges.
- 🧠 **Multi-Tiered AI Triage Pipeline**:
  - **Primary**: Google Gemini (`gemini-2.5-flash` / `gemini-1.5-flash` via `google-genai`).
  - **Secondary**: Groq Cloud (`llama-3.3-70b-versatile`).
  - **Zero-Dependency Fallback**: Built-in deterministic rule engine that runs completely offline with **zero external API keys required**.
- 🛡️ **Autonomous Guardrails & Stopping Rules**:
  - **Max Retry Threshold**: Caps retries at $\ge 3$ per transaction before escalating to human support.
  - **Cooldown Window**: Enforces a configurable delay (default: 12h) to avoid customer friction and bank throttles.
- 📊 **Real-Time Financial Dashboard**:
  - Live revenue analytics: **Total Recovered (₹)**, **Total At-Risk (₹)**, and **Recovery Success Rate (%)**.
  - Interactive Action Breakdown (Smart Retries, Customer Emails, Escalations, Policy Skips).
  - Searchable, timestamped **Audit Log Stream**.
- 🧪 **Interactive Webhook Sandbox**: Built-in UI simulator to trigger 6 realistic payment failure scenarios on demand.
- 🔔 **Multi-Channel Integrations**:
  - **Razorpay API**: Automated payment retry handoff.
  - **Resend**: Automated transactional emails with secure recovery links.
  - **Slack Webhooks**: Real-time urgent alerts to `#ops-escalations`.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Ingestion["1. Secure Ingestion Layer"]
        A[Razorpay Gateway] -->|POST payment.failed Webhook| B[FastAPI Webhook Handler]
        B --> C{Verify HMAC-SHA256 Signature}
        C -- Invalid Signature --> D[400 Bad Request / Reject]
        C -- Valid Signature --> E{Idempotency Check}
        E -- Duplicate Payment ID --> F[200 OK - Duplicate Ignored]
        E -- Fresh Event --> G[(Store in Database: events)]
    end

    subgraph AI["2. Multi-Provider AI Diagnosis"]
        G --> H[AI Triage Orchestrator]
        H -->|Attempt 1| I[Google Gemini API]
        I -- Timeout / Fail / No Key --> J[Groq Llama-3.3-70B]
        J -- Timeout / Fail / No Key --> K[Built-in Heuristic Engine]
        I --> L[Standardized JSON Diagnosis]
        J --> L
        K --> L
        L --> M[(Store in Database: diagnoses)]
    end

    subgraph Guardrails["3. Safety Guardrails & Policy Checks"]
        M --> N{Attempt > Max Retry Limit?}
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

    subgraph UI["5. Live Real-Time Dashboard"]
        X --> Y[React 18 + Vite Frontend Dashboard]
        Y --> Z[Live Metric Cards & Recharts Trends]
    end
```

---

## 🎯 Triage Branches & Recovery Actions

The AI agent classifies incoming errors into three core operational branches:

```
                                    ┌──► 1. Smart Retry (Transient bank timeouts, insufficient funds)
Incoming payment.failed Webhook ────┼──► 2. Reminder Email (Expired card, 3DS authentication failure, CVV)
                                    └──► 3. Human Escalation (Suspected fraud, chargeback dispute, limit exceeded)
```

| Scenario | Razorpay Error Code / Description | Recovery Branch | Automated Dispatch Channel |
| :--- | :--- | :--- | :--- |
| **Bank Timeout / Gateway Drop** | `GATEWAY_TIMEOUT`<br>`BAD_REQUEST_PAYMENT_FAILED` | **Smart Retry** | Scheduled retry via Razorpay API |
| **Insufficient Funds** | `INSUFFICIENT_FUNDS`<br>`LOW_BALANCE` | **Smart Retry** | Delayed retry (optimal retry timing) |
| **Expired Card / Invalid Card** | `BAD_REQUEST_PAYMENT_CARD_EXPIRED` | **Reminder Email** | Customer email via **Resend** with card update portal |
| **3DS Authentication Drop** | `BAD_REQUEST_PAYMENT_OTP_INCORRECT`<br>`AUTH_FAILED` | **Reminder Email** | Instant 1-click retry payment link |
| **Suspected Fraud / Risk Anomaly**| `GATEWAY_ERROR_FRAUD_FLAGGED` | **Human Escalation** | Instant alert to **Slack** `#ops-escalations` |
| **Chargeback / Dispute** | `PAYMENT_DISPUTE_RAISED` | **Human Escalation** | Support ticket creation & Slack alert |
| **Excessive Retries ($\ge 3$)** | Any failure repeated $\ge 3$ times | **Human Escalation** | Automatic Guardrail safety escalation |

---

## 🛡️ Financial Guardrails & Safety Rules

1. **Max Retry Ceiling (`MAX_RETRY_ATTEMPTS = 3`)**:
   - If a customer's transaction fails repeatedly, continuing to hit the payment gateway can result in bank fraud blocks, card locking, and merchant penalty fees.
   - Once total attempts hit the threshold, the agent overrides any AI recommendation and routes the transaction directly to human operators.

2. **Cooldown Throttle (`RETRY_COOLDOWN_HOURS = 12`)**:
   - Multiple rapid retries within short timeframes irritate customers and trigger gateway rate-limits.
   - If a new failure arrives within the cooldown window for the same payment/customer, the event is logged as `skipped_stopping_rule` without re-executing charges.

3. **Cryptographic Webhook Verification**:
   - Uses `hmac.compare_digest` on the raw request byte stream against `RAZORPAY_WEBHOOK_SECRET` to prevent timing attacks and spoofed webhook injections.

---

## 💻 Tech Stack

<div align="center">

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | High-performance asynchronous Python web framework |
| **Database & ORM** | [SQLAlchemy 2.0 (Async)](https://www.sqlalchemy.org/) + [AsyncPG](https://github.com/MagicStack/asyncpg) / [aiosqlite](https://github.com/omnilib/aiosqlite) | Async relational database layer (PostgreSQL & SQLite) |
| **Migrations** | [Alembic](https://alembic.sqlalchemy.org/) | Relational database schema versioning |
| **Validation & Config** | [Pydantic v2](https://docs.pydantic.dev/) + `pydantic-settings` | Schema validation, type safety, and environment parsing |
| **Rate Limiting** | [SlowAPI](https://github.com/laurentS/slowapi) | Token-bucket API request rate limiting |
| **AI Triage Layer** | [Google Gemini](https://aistudio.google.com/) + [Groq Cloud](https://groq.com/) | LLM diagnosis with automatic fallback to local heuristic engine |
| **Integrations** | [Razorpay SDK](https://razorpay.com/) • [Resend](https://resend.com/) • [Slack API](https://api.slack.com/) | Payment operations, transactional emails, and team escalation |
| **Frontend UI** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Tailwind CSS 3.4](https://tailwindcss.com/) | Responsive, modern fintech dashboard UI |
| **Data Viz & Icons** | [Recharts](https://recharts.org/) + [Lucide React](https://lucide.dev/) | Financial recovery charts and UI iconography |
| **DevOps & Containers** | [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) | Multi-container staging (FastAPI, PostgreSQL, n8n) |

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
│       ├── config.py               # Pydantic environment configuration & settings
│       ├── database.py             # Async database connection and session management
│       ├── models.py               # SQLAlchemy ORM models (Event, Diagnosis, Action, AuditLog)
│       ├── schemas.py              # Pydantic DTO schemas
│       ├── security.py             # Cryptographic HMAC-SHA256 signature verification
│       ├── ai_agent.py             # Multi-model AI triage engine (Gemini -> Groq -> Heuristics)
│       ├── executor.py             # Guardrail policy checks & action execution
│       ├── razorpay_client.py      # Razorpay payment retry and refund wrapper
│       ├── email_client.py         # Resend transactional email client
│       ├── slack_client.py         # Slack webhook notification client
│       ├── routes/
│       │   ├── webhooks.py         # Production Razorpay webhook ingestion endpoint
│       │   ├── dashboard.py        # Analytics aggregation & audit trail endpoints
│       │   └── dev_tools.py        # Webhook simulator sandbox & test utilities
│       └── tests/
│           ├── test_webhooks.py    # Signature & idempotency test cases
│           ├── test_executor.py    # Guardrail rules & execution test cases
│           └── test_claude_agent.py# AI diagnostic fallback tests
│
└── frontend/
    ├── package.json                # React frontend dependencies & scripts
    ├── vite.config.js              # Vite bundler configuration
    ├── tailwind.config.js          # Tailwind CSS theme & tokens
    ├── postcss.config.js           # PostCSS configuration
    ├── .env.example                # Frontend environment template
    └── src/
        ├── App.jsx                 # Dashboard root layout & state orchestration
        ├── api.js                  # Axios client with base URL & auth headers
        ├── index.css               # Global styles, scrollbar tokens & custom utilities
        ├── main.jsx                # React DOM entrypoint
        └── components/
            ├── Header.jsx          # Top navigation bar, live status & quick actions
            ├── SummaryCards.jsx    # Metric KPIs (₹ Recovered, ₹ At-Risk, Recovery Rate)
            ├── RecoveryChart.jsx   # Visual analytics (Bar & Area charts)
            ├── AuditTable.jsx      # Filterable, searchable audit log stream
            ├── GuardrailsPanel.jsx # Active stopping rule configuration display
            ├── WebhookSimulator.jsx# Developer sandbox for failure scenario triggers
            └── Footer.jsx          # Footer & environment indicator
```

---

## 🗄️ Database Relational Schema

```text
┌──────────────────────────┐       ┌──────────────────────────┐
│          events          │       │        diagnoses         │
├──────────────────────────┤       ├──────────────────────────┤
│ id (UUID, PK)            │───┐   │ id (UUID, PK)            │
│ razorpay_payment_id (STR)│   └──►│ event_id (UUID, FK)      │
│ amount_paise (BIGINT)    │       │ root_cause (STR)         │
│ error_code (STR)         │       │ confidence (STR)         │
│ error_description (STR)  │       │ created_at (TIMESTAMP)   │
│ customer_id (STR)        │       └──────────────────────────┘
│ raw_payload (JSONB/JSON) │
│ received_at (TIMESTAMP)  │       ┌──────────────────────────┐
└──────────────────────────┘       │         actions          │
            │                      ├──────────────────────────┤
            │                      │ id (UUID, PK)            │
            ├─────────────────────►│ event_id (UUID, FK)      │
            │                      │ action_type (STR)        │
            │                      │ attempt_number (INT)     │
            │                      │ status (STR)             │
            │                      │ amount_recovered (BIGINT)│
            │                      │ executed_at (TIMESTAMP)  │
            │                      └──────────────────────────┘
            │
            │                      ┌──────────────────────────┐
            │                      │        audit_log         │
            │                      ├──────────────────────────┤
            │                      │ id (UUID, PK)            │
            └─────────────────────►│ event_id (UUID, FK)      │
                                   │ diagnosis_id (UUID, FK)  │
                                   │ action_id (UUID, FK)     │
                                   │ summary (STR)            │
                                   │ created_at (TIMESTAMP)   │
                                   └──────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: `3.10` or higher
- **Node.js**: `18.x` or higher (`npm` / `yarn` / `pnpm`)
- **Git**

---

### 1. Backend Setup

1. **Clone the repository and open the backend folder:**
   ```bash
   git clone https://github.com/your-username/Razorpay.git
   cd Razorpay/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Windows (CMD):
   python -m venv venv
   .\venv\Scripts\activate.bat

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Windows:
   copy .env.example .env

   # macOS / Linux:
   cp .env.example .env
   ```

5. **Run database migrations / initialize tables:**
   *(FastAPI automatically initializes SQLite / PostgreSQL tables on startup).*

6. **Start the FastAPI development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

1. **Open a new terminal and navigate to the frontend folder:**
   ```bash
   cd Razorpay/frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Windows:
   copy .env.example .env

   # macOS / Linux:
   cp .env.example .env
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open your browser at **[http://localhost:5173](http://localhost:5173)** to view the live dashboard.

---

### 3. Docker Compose Setup (Multi-Container)

To run the entire ecosystem (PostgreSQL 16, FastAPI Backend, and n8n Visual Orchestrator) in Docker:

```bash
# From the repository root
docker-compose up --build -d
```

- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **n8n Workflow Console**: [http://localhost:5678](http://localhost:5678)
- **PostgreSQL**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: revenue_recovery`)

---

## 🌐 Testing Live Razorpay Webhooks (Local Tunnel)

To test webhooks directly from your live Razorpay Dashboard in Test Mode:

1. **Start a tunnel to your local backend (Port 8000):**
   ```bash
   # Using ngrok:
   ngrok http 8000

   # Or using localtunnel:
   npx localtunnel --port 8000
   ```

2. **Configure Razorpay Dashboard:**
   - Go to **Razorpay Dashboard > Settings > Webhooks > Add New Webhook**.
   - **Webhook URL**: `https://<your-tunnel-subdomain>.ngrok-free.app/webhooks/razorpay`
   - **Secret**: Set a secret (e.g. `my_secret_123`) and put the same value in `backend/.env` under `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**: Check `payment.failed`.

3. Trigger a failed payment on Razorpay Checkout test mode; watch the AI agent triage the failure live on your dashboard!

---

## ⚙️ Environment Configuration Reference

### Backend Configuration (`backend/.env`)

```ini
# ===================================================================
# 🆓 AI PROVIDER CONFIGURATION (Choose any or leave empty for offline heuristic)
# ===================================================================
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# ===================================================================
# RAZORPAY GATEWAY CREDENTIALS
# ===================================================================
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# ===================================================================
# DATABASE CONFIGURATION
# ===================================================================
# SQLite (Local Dev):
DATABASE_URL=sqlite+aiosqlite:///./revenue_recovery.db
# PostgreSQL (Docker/Prod):
# DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/revenue_recovery

# ===================================================================
# INTEGRATIONS & NOTIFICATIONS
# ===================================================================
RESEND_API_KEY=re_your_resend_api_key_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# ===================================================================
# SECURITY & GUARDRAILS
# ===================================================================
DASHBOARD_API_KEY=your_secure_dashboard_api_key
ENVIRONMENT=development
MAX_RETRY_ATTEMPTS=3
RETRY_COOLDOWN_HOURS=12
```

### Frontend Configuration (`frontend/.env`)

```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000

# Secret key matching DASHBOARD_API_KEY in backend
VITE_DASHBOARD_API_KEY=your_secure_dashboard_api_key
```

---

## 🔌 API Reference & cURL Examples

### 1. Webhook Ingestion Endpoint

`POST /webhooks/razorpay`

Receives raw payment failed events from Razorpay.

**Headers:**
- `Content-Type: application/json`
- `X-Razorpay-Signature: <hmac_sha256_hex_digest>`

**Sample Request Body:**
```json
{
  "entity": "event",
  "account_id": "acc_12345",
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test_987654",
        "amount": 499900,
        "currency": "INR",
        "status": "failed",
        "customer_id": "cust_rahul_01",
        "error_code": "BAD_REQUEST_PAYMENT_CARD_EXPIRED",
        "error_description": "Card expiry date has passed"
      }
    }
  }
}
```

---

### 2. Dashboard Metrics & Audit Logs

`GET /api/dashboard`

Fetches real-time financial recovery metrics, breakdown statistics, and recent audit logs.

**Headers:**
- `x-api-key: <DASHBOARD_API_KEY>` *(Required in production)*

**Sample cURL:**
```bash
curl -X GET "http://localhost:8000/api/dashboard" \
  -H "x-api-key: your_secure_dashboard_api_key"
```

**Sample Response:**
```json
{
  "total_recovered_paise": 1549700,
  "total_at_risk_paise": 2899400,
  "recovery_rate_pct": 53.4,
  "total_actions": 6,
  "successful_actions": 4,
  "total_events": 6,
  "breakdown": {
    "retry_payment": 2,
    "send_reminder_email": 2,
    "escalate_to_human": 1,
    "skipped_stopping_rule": 1
  },
  "guardrails": {
    "max_retry_attempts": 3,
    "retry_cooldown_hours": 12,
    "environment": "development"
  },
  "recent_audit_log": [
    {
      "id": "7b8e5c12-3211-4f90-bf4a-89a11ef091a2",
      "summary": "retry_payment attempt 1: success (₹4999.00 recovered)",
      "created_at": "2026-08-27T12:00:00Z"
    }
  ]
}
```

---

### 3. Developer Sandbox Simulator

`POST /api/dev/simulate-webhook`

Triggers simulated failures on demand without needing Razorpay credentials.

**Available Scenarios:**
- `insufficient_funds`
- `expired_card`
- `bank_timeout`
- `fraud_suspected`
- `3ds_auth_failed`
- `dispute_chargeback`

**Sample cURL:**
```bash
curl -X POST "http://localhost:8000/api/dev/simulate-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "insufficient_funds",
    "amount_paise": 499900,
    "customer_id": "cust_arjun_01"
  }'
```

---

### 4. Demo Data Seeder & Reset

- **Seed 6 realistic recovery records**:
  ```bash
  curl -X POST "http://localhost:8000/api/dev/seed-demo-data"
  ```
- **Clear all test records**:
  ```bash
  curl -X DELETE "http://localhost:8000/api/dev/reset-data"
  ```

---

## 🧪 Testing & Quality Assurance

The test suite validates webhook signature security, idempotency guarantees, guardrail thresholds, and multi-model AI decision fallbacks.

Run the test suite with `pytest`:

```bash
cd backend
pytest -v
```

### Test Coverage Highlights:
- ✅ `test_webhooks.py`: Verifies valid and invalid HMAC-SHA256 signature rejections, ignoring non-failure events, and idempotency on duplicate payment IDs.
- ✅ `test_executor.py`: Validates maximum retry count transitions to human escalation ($\ge 3$), cooldown interval skip logic, and database state recording.
- ✅ `test_claude_agent.py` / `ai_agent.py`: Validates heuristic and LLM decision consistency across known failure codes.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>1. Do I need paid OpenAI or Anthropic API keys to run this?</b></summary>
<br>
No! You can run this project completely for free:
- <b>Option 1</b>: Built-in Free Diagnostic Engine (runs automatically with 0 API keys).
- <b>Option 2</b>: Free Google Gemini API Key from <a href="https://aistudio.google.com/">Google AI Studio</a>.
- <b>Option 3</b>: Free Groq Cloud API Key from <a href="https://console.groq.com/">Groq Console</a>.
</details>

<details>
<summary><b>2. How does the agent prevent charging a customer twice?</b></summary>
<br>
The pipeline checks payment idempotency at the database level against <code>razorpay_payment_id</code> before starting diagnosis. Furthermore, the 12-hour cooldown guardrail guarantees that duplicate webhook deliveries are safely acknowledged without executing repeated charges.
</details>

<details>
<summary><b>3. Can I use PostgreSQL instead of SQLite?</b></summary>
<br>
Yes! Simply update <code>DATABASE_URL</code> in <code>backend/.env</code> to your PostgreSQL async connection string:
<code>postgresql+asyncpg://username:password@localhost:5432/dbname</code>.
</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for intelligent, autonomous fintech workflows.</sub>
</div>
