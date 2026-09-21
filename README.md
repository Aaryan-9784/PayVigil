# 🛡️ PayVigil — Autonomous AI Payment Recovery & Revenue Assurance Engine

<div align="center">

[![Razorpay Buildathon 2026](https://img.shields.io/badge/Razorpay_Buildathon_2026-Track_03:_Autonomous_Revenue_Recovery-0c83ff?style=for-the-badge&logo=razorpay)](https://razorpay.com)
[![Live Frontend Demo](https://img.shields.io/badge/Vercel_Frontend-pay--vigil.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pay-vigil.vercel.app)
[![Live Backend API](https://img.shields.io/badge/Render_API-payvigil--backend.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://payvigil-backend.onrender.com/health)
[![Interactive Swagger Docs](https://img.shields.io/badge/FastAPI_Docs-Swagger_UI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://payvigil-backend.onrender.com/docs)
[![PostgreSQL](https://img.shields.io/badge/Supabase_PostgreSQL-Pooler_Active-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com)
[![Tests Passing](https://img.shields.io/badge/Tests-43%2F43_Passing-22c55e?style=for-the-badge&logo=pytest&logoColor=white)]()

<br/>

**Autonomous Payment Failure Triage, Multi-Agent Root-Cause Diagnosis & Self-Healing Revenue Recovery for the Razorpay Ecosystem**

[Explore Live Web App ↗](https://pay-vigil.vercel.app) • [Interactive API Swagger Docs ↗](https://payvigil-backend.onrender.com/docs) • [ReDoc Specification ↗](https://payvigil-backend.onrender.com/redoc) • [Health Check ↗](https://payvigil-backend.onrender.com/health)

</div>

---

## 🌐 Live Cloud Infrastructure & Deployments

| Component | Host / Cloud Platform | Live Deployment Link | Uptime / Status |
|---|---|---|:---:|
| 💻 **Frontend Web App** | **Vercel** | [https://pay-vigil.vercel.app](https://pay-vigil.vercel.app) | 🟢 **Live & Operational** |
| ⚡ **Backend REST API** | **Render (Python 3.11)** | [https://payvigil-backend.onrender.com](https://payvigil-backend.onrender.com) | 🟢 **Live & Operational** |
| 📖 **Interactive API Docs** | **FastAPI Swagger UI** | [https://payvigil-backend.onrender.com/docs](https://payvigil-backend.onrender.com/docs) | 🟢 **Interactive** |
| 📚 **ReDoc API Spec** | **FastAPI ReDoc** | [https://payvigil-backend.onrender.com/redoc](https://payvigil-backend.onrender.com/redoc) | 🟢 **Available** |
| 💓 **Live Health Probe** | **Render Keep-Alive** | [https://payvigil-backend.onrender.com/health](https://payvigil-backend.onrender.com/health) | 🟢 **200 OK** |
| 🔌 **WebSocket Stream** | **Render WebSockets** | `wss://payvigil-backend.onrender.com/ws/events` | 🟢 **Streaming Live** |
| 🎯 **Razorpay Webhook Ingress** | **Render** | `https://payvigil-backend.onrender.com/api/webhooks/razorpay` | 🟢 **Active Ingress** |
| 🗄️ **Managed Database** | **Supabase (AWS ap-south-1)** | PostgreSQL 16 + Session / Transaction Pooler (Port 5432) | 🟢 **Connected** |

---

### 🔑 Instant Demo & Judge Sign-In Credentials

To test the live dashboard immediately without manual registration, use the pre-configured administrator demo credentials:

```yaml
URL:      https://pay-vigil.vercel.app
Email:    aaryanpatel9784@gmail.com
Password: Aryan@9784
Passkey:  TSDkf1pltC2m41sm95baMx1TJmKt7769iK99TU8BQDD
```

---

## 📌 Problem Statement & Executive Summary

In India's high-volume digital payments ecosystem, **between 25% and 35% of payment attempts fail** due to transient bank network congestion, NPCI UPI switch spikes, daily UPI limits, expired card credentials, and RBI 2-Factor Authentication (2FA) mandate drops.

When a payment gateway throws an error, **over 70% of high-intent customers abandon their cart**, resulting in billions of rupees in unrecovered Gross Merchandise Value (GMV).

### 💡 The Solution: PayVigil
**PayVigil** is an enterprise-grade Autonomous AI Revenue Recovery Engine built natively for the Razorpay ecosystem. It intercepts real-time `payment.failed` webhooks, performs **sub-200ms multi-agent root cause diagnosis**, and executes optimal recovery workflows while enforcing strict financial safety guardrails.

---

## 🏗️ System Architecture & Workflow

![PayVigil System Flow](docs/final_system_flow.jpg)

```mermaid
flowchart TD
    A[Razorpay Webhook: payment.failed] --> B[HMAC-SHA256 Signature Verification & PII Masking]
    B --> C{AI Multi-Agent Diagnostic Engine}
    
    C -->|Transient Gateway / Bank Downtime| D[Case 1: Smart Gateway Auto-Retry]
    C -->|Customer Action Needed: Expired Card / Limit| E[Case 2: 1-Click Multi-Channel Recovery Link]
    C -->|High-Risk / VIP Order >₹10k / Repeated Failure| F[Case 3: Human Support & Concierge Escalation]
    
    D --> G[Exponential Backoff / Salary-Cycle Queue]
    E --> H[Razorpay Hosted Checkout + Resend Email + 1-Tap WhatsApp]
    F --> I[Slack Block Kit Alert Card + Support CRM Ticket]
    
    G & H & F --> J[Immutable Audit Log & Real-Time WebSocket Broadcast]
    J --> K[(Supabase PostgreSQL Database)]
```

---

## ⚡ Core Recovery Architecture (The 3-Case Taxonomy)

### 1️⃣ Case 1: Smart Gateway Auto-Retry (Zero Friction)
* **Failure Triggers**: `GATEWAY_TIMEOUT`, bank network switch congestion, transient insufficient funds.
* **AI Decision**: `retry_payment`
* **Automated Action**: Automatically triggers a retry through Razorpay with exponential backoff and jitter buffers. Features **Salary-Cycle Scheduling** (aligning retries for the 1st of the month at 09:30 AM IST for month-end low balance drops).

### 2️⃣ Case 2: 1-Click Multi-Channel Recovery (Self-Serve)
* **Failure Triggers**: Expired card (`BAD_REQUEST_PAYMENT_CARD_EXPIRED`), NPCI UPI PIN lockouts, daily UPI limits exceeded, RBI >₹15,000 e-mandate rules.
* **AI Decision**: `send_reminder_email`
* **Automated Action**: Creates an instant Razorpay-hosted 1-click checkout recovery link and dispatches personalized, localized payment receipts across **Transactional Email (Resend)**, **1-Tap WhatsApp**, and **SMS**.

### 3️⃣ Case 3: Human Support & VIP Concierge Escalation
* **Failure Triggers**: High-value transactions (>₹10,000 / VIP accounts), suspected fraud/dispute anomalies (`GATEWAY_ERROR_FRAUD_FLAGGED`), or orders exceeding the 3-attempt limit.
* **AI Decision**: `escalate_to_human`
* **Automated Action**: Dispatches an urgent **Slack Block Kit alert card** with customer context, opens a priority **CRM support ticket**, and emails the merchant support desk for white-glove assistance.

---

## 🤖 3-Tier Multi-Provider AI Diagnostic Engine

PayVigil utilizes an intelligent multi-tiered AI fallback chain that balances reasoning depth, speed, and 100% uptime:

```
┌───────────────────────────────────────────────────────────┐
│              Incoming Failed Payment Payload              │
└─────────────────────────────┬─────────────────────────────┘
                              │
               ┌──────────────▼──────────────┐
               │   Tier 1: Gemini 2.5 Flash   │ ──► Latency: ~150ms (Deep Reasoning)
               └──────────────┬──────────────┘
                              │ (On Rate-Limit / Timeout)
               ┌──────────────▼──────────────┐
               │ Tier 2: Groq Llama 3.3 70B  │ ──► Latency: ~80ms (Ultra-Fast Fallback)
               └──────────────┬──────────────┘
                              │ (On Network Anomaly)
               ┌──────────────▼──────────────┐
               │ Tier 3: Heuristic Rule Base │ ──► Latency: <1ms (100% Availability)
               └─────────────────────────────┘
```

| Tier | Engine | Latency | Purpose |
|---|---|---|---|
| **Tier 1 (Primary)** | **Google Gemini 2.5 Flash** | ~150ms | Deep reasoning across complex payment failure payloads with structured JSON schema outputs. |
| **Tier 2 (Fallback)** | **Groq Llama 3.3 70B Versatile** | ~80ms | Ultra-fast inference fallback during Gemini rate limits or high-concurrency spikes. |
| **Tier 3 (Deterministic)** | **Rule-Based Heuristic Engine** | < 1ms | Zero-latency emergency fallback guaranteeing 100% system availability. |

---

## 🛡️ Enterprise Financial Guardrails & Stopping Rules

1. **Max 3-Attempt Hard Stopping Rule**: Automatically terminates automated retry loops after 3 unsuccessful attempts and escalates to human specialists.
2. **12-Hour Cooldown Anti-Spam Window**: Enforces an idempotency cooldown period to prevent duplicate charges and avoid customer message fatigue.
3. **Cryptographic Security Defense**: Constant-time HMAC-SHA256 signature verification protects against replay attacks; a 1MB payload ceiling prevents memory exhaustion.
4. **PII Sanitization & Redaction**: Customer phone numbers and email addresses are masked and hashed before database storage.
5. **OWASP Standard Security Headers**: Strict Content-Type sniffing prevention, Frame Options DENY, XSS protection, and Strict-Transport-Security.

---

## 🌟 Key Platform Features

* ⚡ **Live Real-Time Streaming**: Native WebSocket connection (`/ws/events`) streams failure diagnosis, recovery status, and audit logs live to the dashboard without page reloads.
* 🇮🇳 **Dual-Language Customer Messaging**: AI automatically creates recovery messages in both **Professional English** and **Relatable Hinglish** for higher Indian conversion rates.
* 🏦 **Bank Health Matrix**: Real-time telemetry monitoring uptime and average latency across top Indian banking rails (HDFC, SBI, ICICI, Axis, Kotak, PayTM UPI).
* 📊 **Recovery Analytics**: Track Total Recovered Revenue, At-Risk GMV, Recovery Conversion Rate %, and AI Decision breakdowns.
* 🧪 **Interactive Dev Simulation Tools**: One-click webhook simulation inside the dashboard to test all failure scenarios on demand.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Cloud health check probe and uptime status |
| `POST` | `/api/webhooks/razorpay` | Ingress webhook for Razorpay `payment.failed` & `payment.captured` |
| `GET` | `/api/dashboard/stats` | High-level KPI metrics (Recovered GMV, At-Risk Revenue, Conversion Rate) |
| `GET` | `/api/dashboard/failed-payments` | Paginated list of failed payments with AI triage decisions |
| `GET` | `/api/dashboard/bank-health` | Live bank uptime and NPCI switch health matrix |
| `POST` | `/api/dev/simulate-failure` | Developer simulation endpoint for testing edge cases |
| `WS` | `/ws/events` | Real-time WebSocket connection for live telemetry feeds |

---

## 🛠️ Complete Tech Stack

* **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons, Recharts, WebSocket Client
* **Backend**: FastAPI (Python 3.11), SQLAlchemy 2.0 Async ORM, Pydantic V2, Uvicorn, SlowAPI (Rate Limiting)
* **Database**: PostgreSQL on Supabase (AWS ap-south-1) + AsyncPG driver
* **AI Orchestration**: Google GenAI SDK (`gemini-2.5-flash`), Groq SDK (`llama-3.3-70b-versatile`)
* **Integrations**: Razorpay Payments & Webhooks, Resend API (Email), Twilio (WhatsApp & SMS), Slack Webhooks
* **Hosting**: Vercel (Frontend), Render (Backend API), Supabase (Cloud Database)

---

## 🚀 Quickstart & Local Setup

### 1. Clone the Repository
```powershell
git clone https://github.com/Aaryan-9784/PayVigil.git
cd PayVigil
```

### 2. Backend Setup
```powershell
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> API Documentation available at `http://localhost:8000/docs`

### 3. Frontend Setup
```powershell
cd ../frontend
npm install
npm run dev
```
> Dashboard live at `http://localhost:5173`

### 4. Running the Automated Test Suite
```powershell
cd ../backend
pytest app/tests/ -v
```
*(43/43 tests pass covering financial guardrails, HMAC signatures, diagnostics, and webhooks).*

---

## 👥 Team & Submission Information

* **Hackathon**: Razorpay Buildathon 2026
* **Track**: Track 03 — Autonomous Revenue Recovery
* **Project**: PayVigil
* **Author**: Aryan Patel ([@Aaryan-9784](https://github.com/Aaryan-9784))
* **License**: MIT License
