# AI Revenue Recovery Agent

An autonomous, production-grade payment revenue recovery pipeline built for Razorpay with multi-provider AI orchestration (Gemini / Groq / built-in heuristic).

```
Payment fails (Razorpay sends payment.failed webhook)
        ↓
FastAPI Webhook Handler (Raw HMAC-SHA256 signature verification & Idempotency)
        ↓
AI Agent Diagnoses & Decides (Gemini → Groq → Built-in Heuristic fallback)
        ↓
Flow Branches:
   ├── Retry payment (Transient bank timeouts, gateway errors, insufficient funds)
   ├── Send reminder email (Expired cards, 3DS authentication failure, CVV errors)
   └── Escalate to human (Disputes, fraud flags, high-value limits, repeated failures)
        ↓
Stopping Rules & Guardrails:
   ├── Rule 1: Max retry limit (>= 3 retries automatically escalates to human)
   └── Rule 2: Cooldown interval (Attempts within cooldown window marked 'skipped_stopping_rule')
        ↓
Immutable Audit Trail & Metrics Logging
        ↓
Live Interactive Fintech Dashboard (₹ Recovered, At-Risk, Recovery Rate %, Live Audit Trail, Test Simulator)
```

## Architecture & Tech Stack

- **Backend**: FastAPI, SQLAlchemy (Async), PostgreSQL / SQLite, Pydantic v2, Alembic, SlowAPI
- **AI Agent**: Google Gemini (`google-generativeai`) / Groq (`groq`) with automatic fallback to built-in heuristic engine
- **Integrations**: Razorpay SDK, Resend (Email), Slack Webhooks (Escalation)
- **Frontend**: Vite, React 18, Tailwind CSS, Lucide React, Recharts, Axios

## Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys or use development defaults

uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to explore the live dashboard and interactive payment failure simulator.
