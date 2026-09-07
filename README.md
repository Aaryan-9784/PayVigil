# 🛡️ PayVigil — Autonomous AI Payment Recovery & Revenue Assurance Engine

[![Razorpay Buildathon 2026](https://img.shields.io/badge/Razorpay_Buildathon_2026-Track_03:_Autonomous_Revenue_Recovery-0c83ff?style=for-the-badge&logo=razorpay)](https://razorpay.com)
[![Vercel Deployment](https://img.shields.io/badge/Vercel_Frontend-000000?style=for-the-badge&logo=vercel)](https://pay-vigil.vercel.app)
[![Render Backend](https://img.shields.io/badge/Render_Backend-46E3B7?style=for-the-badge&logo=render)](https://payvigil-backend.onrender.com/docs)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Groq Llama 3.3](https://img.shields.io/badge/Groq_Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_Supabase-316192?style=for-the-badge&logo=postgresql)](https://supabase.com)
[![Tests Passing](https://img.shields.io/badge/Tests-43%2F43_Passing-22c55e?style=for-the-badge)]()

> 🚀 **Live Production Dashboard (Vercel):** [https://pay-vigil.vercel.app](https://pay-vigil.vercel.app)  
> ⚡ **Live Backend API & Swagger Docs (Render):** [https://payvigil-backend.onrender.com/docs](https://payvigil-backend.onrender.com/docs)  
> 🪝 **Live Webhook Ingress:** `https://payvigil-backend.onrender.com/api/webhooks/razorpay`  
> 📦 **GitHub Repository:** [https://github.com/Aaryan-9784/PayVigil](https://github.com/Aaryan-9784/PayVigil)  
> 🔑 **Demo Admin Credentials:** `aaryanpatel9784@gmail.com` / `Aryan@9784` *(or Passkey: `TSDkf1pltC2m41sm95baMx1TJmKt7769iK99TU8BQDD`)*

---

## 📌 Executive Summary & Problem Statement

In India's fast-moving digital economy, **over 25% to 35% of digital transactions fail** due to transient bank downtimes, NPCI UPI congestion, daily limits, expired card credentials, and RBI 2FA mandate drops. When a standard payment gateway returns an error, **over 70% of high-intent customers abandon their cart**, resulting in billions of dollars in unrecovered GMV.

**PayVigil** is an enterprise-grade Autonomous AI Revenue Recovery Engine built natively for Razorpay. It captures real-time payment.failed webhooks, performs sub-200ms multi-agent root cause diagnosis, and executes automated recovery workflows with strict financial guardrails.

---

## ⚡ Core Recovery Architecture (The 3-Case Taxonomy)

`mermaid
flowchart TD
    A[Razorpay Webhook: payment.failed] --> B[HMAC-SHA256 Signature Verification & PII Redaction]
    B --> C{AI Multi-Agent Diagnostic Engine}
    
    C -->|Transient Gateway / Bank Timeout| D[Case 1: Smart Gateway Auto-Retry]
    C -->|Customer Action Needed: Expired Card / UPI Limit| E[Case 2: 1-Click Multi-Channel Recovery Link]
    C -->|High-Risk / VIP Order >₹10k / Repeated Failure| F[Case 3: Human Support & Concierge Escalation]
    
    D --> G[Exponential Backoff / Salary-Cycle Queue]
    E --> H[Razorpay Hosted Checkout + Resend Email + 1-Tap WhatsApp]
    F --> I[Slack Block Kit Alert Card + CRM Ticket + Support Email]
    
    G & H & F --> J[Immutable Audit Log & Real-Time WebSocket Broadcast]
    J --> K[(Supabase PostgreSQL Database)]
`

### 1️⃣ Case 1: Smart Gateway Auto-Retry
* **Scenarios**: Bank network timeouts (GATEWAY_TIMEOUT), switch concurrency spikes, temporary insufficient funds.
* **AI Decision**: 
etry_payment
* **Execution**: Retries the transaction via Razorpay with exponential backoff and jitter buffers. Features **Salary-Cycle Scheduling** (auto-aligning retries for the 1st of the month at 09:30 AM IST for month-end low balance).

### 2️⃣ Case 2: 1-Click Multi-Channel Recovery
* **Scenarios**: Expired cards (BAD_REQUEST_PAYMENT_CARD_EXPIRED), NPCI 24-hour UPI PIN lockouts, daily UPI limits exceeded, RBI >₹15,000 e-mandate AFA rules.
* **AI Decision**: send_reminder_email
* **Execution**: Generates a secure Razorpay-hosted 1-click checkout recovery link and dispatches structured payment receipts across **Transactional Email (Resend)**, **1-Tap WhatsApp**, and **SMS**.

### 3️⃣ Case 3: Human Support & Concierge Escalation
* **Scenarios**: High-value luxury orders (>₹10,000 / VIP tickets), suspected dispute/fraud anomalies (GATEWAY_ERROR_FRAUD_FLAGGED), or transactions exceeding the 3-attempt retry limit.
* **AI Decision**: escalate_to_human
* **Execution**: Dispatches an urgent **Slack Block Kit alert card** with customer metadata, opens a **CRM Support Recovery Ticket**, and delivers a priority escalation email to the merchant support team.

---

## 🛡️ Enterprise Financial Guardrails & Stopping Rules

1. **Max 3-Attempt Hard Stopping Rule**: Automatically terminates automated retry loops after 3 unsuccessful attempts and escalates to human specialists.
2. **12-Hour Cooldown Anti-Spam Window**: Enforces an idempotency cooldown period to prevent duplicate charges and avoid customer message fatigue.
3. **Cryptographic Security Defense**: Constant-time HMAC-SHA256 signature verification protects against replay attacks; a 1MB payload ceiling prevents memory exhaustion.
4. **PII Sanitization & Redaction**: Customer phone numbers and email addresses are masked and hashed before database storage.

---

## 🤖 3-Tier Multi-Provider AI Diagnostic Engine

| Tier | Engine | Latency | Purpose |
|---|---|---|---|
| **Primary** | **Google Gemini 2.0 Flash** (google-genai SDK) | ~150ms | Context-aware reasoning across complex payment failure payloads. |
| **Secondary Fallback** | **Groq Llama 3.3 70B Versatile** | ~80ms | Ultra-fast inference fallback during Gemini rate limits. |
| **Deterministic Layer** | **Rule-Based Heuristic Engine** | < 1ms | Zero-latency emergency fallback guaranteeing 100% uptime. |

---

## 🛠️ Tech Stack & System Architecture

* **Backend**: FastAPI (Python 3.11), SQLAlchemy Async ORM, Pydantic V2, Uvicorn
* **Database**: PostgreSQL (AWS ap-south-1 on Supabase) + Local SQLite for isolated testing
* **AI & LLM**: Google GenAI SDK, Groq Cloud API, Structured JSON output schemas
* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Native WebSocket Client
* **Integrations**: Razorpay REST API & Webhooks, Resend API (Email), Twilio (WhatsApp & SMS), Slack Block Kit Webhooks
* **Cloud Hosting**: Render (FastAPI Web Service), Supabase (PostgreSQL), Vercel (React Frontend)

### 🌐 Live Production Deployments

| Component | Platform | Live URL | Status |
|---|---|---|:---:|
| **Frontend Web Dashboard** | **Vercel** | [https://pay-vigil.vercel.app](https://pay-vigil.vercel.app) | 🟢 **Live** |
| **Backend REST API** | **Render** | [https://payvigil-backend.onrender.com](https://payvigil-backend.onrender.com) | 🟢 **Live** |
| **Interactive API Docs (Swagger)** | **FastAPI** | [https://payvigil-backend.onrender.com/docs](https://payvigil-backend.onrender.com/docs) | 🟢 **Live** |
| **Razorpay Webhook Ingress** | **Render** | `https://payvigil-backend.onrender.com/api/webhooks/razorpay` | 🟢 **Active** |
| **Database Cluster** | **Supabase** | AWS ap-south-1 PostgreSQL Session Pooler | 🟢 **Connected** |


---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
* Python 3.11+
* Node.js 18+

### 2. Backend Setup
`ash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
`
API Documentation will be live at: http://localhost:8000/docs

### 3. Frontend Setup
`ash
cd frontend
npm install
npm run dev
`
Dashboard will be live at: http://localhost:5173

### 4. Running the Automated Test Suite
`ash
pytest backend/tests/ -v
`
*(43/43 tests pass with full coverage for guardrails, diagnostics, and webhooks).*

### 5. Running the 3-Case Verification Script
`ash
python scratch/test_3_cases.py
`

---

## 👥 Team & Submission Information

* **Track**: Track 03 — Autonomous AI Revenue Recovery Engine
* **Project Name**: PayVigil
* **Author**: Aryan Patel ([@Aaryan-9784](https://github.com/Aaryan-9784))
* **License**: MIT License
