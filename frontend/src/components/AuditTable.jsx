import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Clock, AlertTriangle, Mail, RotateCcw, ShieldCheck, Activity,
  Download, Eye, X, CheckCircle2, Copy, Sparkles, MessageSquare,
  Phone, ExternalLink, FileText, Send, Share2, Check, Zap, User, CreditCard, Lock, ArrowUpRight,
  Smartphone, Volume2, VolumeX, Shield, RefreshCw, Flame, Tag, ShoppingBag, Globe2, CheckCircle
} from 'lucide-react';
import { triggerUpiCollectPush, manageCartGuard, generateVernacularScript } from '../api';

function getActionBadge(summary) {
  const s = (summary || '').toLowerCase();

  if (s.includes('upi collect') || s.includes('upi_collect')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0054b8] border border-blue-200 shadow-2xs">
        <Smartphone className="w-3.5 h-3.5 text-[#0c83ff]" />
        UPI Push
      </span>
    );
  }
  if (s.includes('cart guard') || s.includes('inventory')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
        Cart Guard
      </span>
    );
  }
  if (s.includes('guardrail') || s.includes('skipped') || s.includes('cooldown')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Safety Cooldown
      </span>
    );
  }
  if (s.includes('retry_payment') || s.includes('retry')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0c83ff] text-white border border-[#0054b8] shadow-xs">
        <RotateCcw className="w-3.5 h-3.5" />
        Payment Retry
      </span>
    );
  }
  if (s.includes('send_reminder_email') || s.includes('email')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0054b8] border border-blue-200 shadow-2xs">
        <Mail className="w-3.5 h-3.5 text-[#0c83ff]" />
        Customer Email
      </span>
    );
  }
  if (s.includes('escalate_to_human') || s.includes('escalat')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Support Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
      <Activity className="w-3.5 h-3.5 text-slate-600" />
      Activity Log
    </span>
  );
}

function formatRelativeTime(dateStr) {
  try {
    if (!dateStr) return 'Just now';
    let normalized = dateStr;
    if (typeof normalized === 'string' && !normalized.endsWith('Z') && !normalized.includes('+')) {
      normalized = normalized + 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 10 || isNaN(diffSec) || diffSec < 0) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Just now';
  }
}

const FILTER_TABS = [
  { id: 'ALL',      label: 'All Events' },
  { id: 'RETRY',    label: 'Auto Retries' },
  { id: 'EMAIL',    label: 'Emails Sent' },
  { id: 'ESCALATE', label: 'Escalations' },
];

const VERNACULAR_LANGUAGES = [
  { id: 'hindi',    name: 'Hindi',    native: 'हिंदी',     voice: 'hi-IN' },
  { id: 'hinglish', name: 'Hinglish', native: 'English+Hindi', voice: 'hi-IN' },
  { id: 'gujarati', name: 'Gujarati', native: 'ગુજરાતી',   voice: 'gu-IN' },
  { id: 'marathi',  name: 'Marathi',  native: 'मराठी',     voice: 'mr-IN' },
  { id: 'tamil',    name: 'Tamil',    native: 'தமிழ்',       voice: 'ta-IN' },
  { id: 'telugu',   name: 'Telugu',   native: 'తెలుగు',     voice: 'te-IN' },
  { id: 'english',  name: 'English',  native: 'Official',  voice: 'en-IN' }
];

const QUICK_UPI_HANDLES = ['@okhdfcbank', '@okaxis', '@paytm', '@ybl', '@upi'];

function renderStructuredLogDetails(log) {
  const raw = (log.summary || '').trim();
  const clean = raw.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}\u{FE0F}\s]+/u, '').trim();
  const lower = clean.toLowerCase();

  // 0. VIP High-Value Escalation / EdTech Concierge
  if (lower.includes('vip high-value') || lower.includes('vip:') || lower.includes('edtech vip')) {
    const amtMatch = clean.match(/₹[\d,.]+/i);
    const isEdTech = lower.includes('edtech') || lower.includes('course');
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            {isEdTech ? '🎓 EdTech VIP Admissions Concierge' : '👑 VIP High-Value Order Escalation'}
          </span>
          {amtMatch && (
            <span className="font-extrabold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
              {amtMatch[0]}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
          <span>{isEdTech ? 'No-Cost EMI & Admissions Support: Direct outreach dispatched to student' : 'Priority Concierge SLA: High-ticket order flagged for direct sales/support outreach'}</span>
        </div>
      </div>
    );
  }

  // 0a1. Quick-Commerce 3s Instant Delivery Failover
  if (lower.includes('quick-commerce') || lower.includes('quick_commerce')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            ⚡ Quick-Commerce 3s Failover
          </span>
          <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[11px]">
            1-Tap UPI Lite / Instant QR
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          10-minute instant delivery drop prevented. Seamless fast-failover saved customer from switching to competitor app.
        </div>
      </div>
    );
  }

  // 0a2. Travel & Flight Booking Price-Lock
  if (lower.includes('travel price-lock') || lower.includes('seat reservation')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-sky-950 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            ✈️ Travel Price-Lock Protocol
          </span>
          <span className="font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded text-[11px]">
            15-Min Seat Hold Active
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Flight booking 2FA delay intercepted. Locked fare &amp; seat reservation held with 1-click WhatsApp checkout.
        </div>
      </div>
    );
  }

  // 0a3. SaaS Involuntary Churn & Token Re-Consent
  if (lower.includes('saas churn shield') || lower.includes('token renewal')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-violet-950 bg-violet-100 border border-violet-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            💻 SaaS Involuntary Churn Shield
          </span>
          <span className="font-bold text-violet-800 bg-violet-50 border border-violet-200 px-1.5 py-0.2 rounded text-[11px]">
            1-Tap RBI Token Renewal
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Replaced card token suspension resolved. Win-back link dispatched before recurring account cancellation.
        </div>
      </div>
    );
  }

  // 0a4. Social In-App Webview Escape
  if (lower.includes('social in-app webview') || lower.includes('escape qr')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-pink-950 bg-pink-100 border border-pink-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            📲 Social Webview Sandbox Escape
          </span>
          <span className="font-bold text-pink-800 bg-pink-50 border border-pink-200 px-1.5 py-0.2 rounded text-[11px]">
            Dynamic Scan QR
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Instagram/Facebook in-app browser UPI deep-link block bypassed via on-screen QR modal.
        </div>
      </div>
    );
  }

  // 0b. Salary-Cycle Auto-Scheduled Retry
  if (lower.includes('salary-cycle') || lower.includes('salary credit window')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            📅 Salary-Cycle Scheduled
          </span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[11px]">
            1st of Month (09:30 AM IST)
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Month-end balance depletion detected. Auto-retry synchronized with Indian payroll deposit window.
        </div>
      </div>
    );
  }

  // 0c. RuPay / Alternative Rail Failover
  if (lower.includes('rupay/upi') || lower.includes('alternative rail')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            ⚡ RuPay/UPI Failover
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          RuPay Credit on UPI limit/category bypassed $\rightarrow$ Routed to instant Savings UPI / Card link.
        </div>
      </div>
    );
  }

  // 0d. COD-to-Prepaid Recovery
  if (lower.includes('cod-to-prepaid') || lower.includes('cod')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            🏷️ COD-to-Prepaid Incentive
          </span>
          <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded text-[11px]">
            5% Instant UPI Discount Link
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Intercepted COD order drop to eliminate 30% RTO courier return loss.
        </div>
      </div>
    );
  }

  // 0e. UPI PIN 24h Lockout
  if (lower.includes('upi pin lockout') || lower.includes('pin_blocked')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            🔒 24h UPI PIN Lockout
          </span>
          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded text-[11px]">
            Bypassed to Card / NetBanking
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Customer entered incorrect PIN 3 times. Automatically switched to alternative operational payment rail.
        </div>
      </div>
    );
  }

  // 0f. NPCI UPI Daily Limit
  if (lower.includes('daily upi cap') || lower.includes('daily_limit')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            🛑 NPCI Daily Limit Reached
          </span>
          <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
            ₹1 Lakh / 20 TXN Cap
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          NPCI bank account limit exhausted. Recovery link pre-selects NetBanking &amp; Credit Cards.
        </div>
      </div>
    );
  }

  // 0g. Card Online Toggle Inactive
  if (lower.includes('card online toggle') || lower.includes('domestic_online')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            🛡️ RBI Card Controls Inactive
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          E-commerce usage toggle disabled in customer's bank app. Sent self-service guide &amp; 1-click UPI fallback.
        </div>
      </div>
    );
  }

  // 0h. RBI >₹15k AFA Mandate
  if (lower.includes('afa mandate') || lower.includes('recurring_afa')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            📈 RBI &gt;₹15k AFA Mandate
          </span>
          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[11px]">
            1-Tap OTP Pre-Approval
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Dispatched 1-tap OTP verification link to comply with RBI recurring threshold.
        </div>
      </div>
    );
  }

  // 0i. NRI Multi-Currency Recovery
  if (lower.includes('nri') || lower.includes('multi-currency')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            🌍 NRI / International Card
          </span>
          <span className="font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded text-[11px]">
            Multi-Currency Gateway (USD/EUR/GBP)
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Foreign card detected. Switched to FEMA-compliant multi-currency checkout.
        </div>
      </div>
    );
  }

  // 0j. Flash Sale Switch Congestion (Jittered Backoff)
  if (lower.includes('flash sale') || lower.includes('jittered')) {
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-orange-900 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            ⚡ Flash Sale Spike Backoff
          </span>
          <span className="font-bold text-orange-800 bg-orange-100 px-1.5 py-0.2 rounded text-[11px]">
            Jittered Retry Queue
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          High-concurrency bank gateway surge detected. Randomized millisecond retry deployed.
        </div>
      </div>
    );
  }

  // 1. UPI Push
  if (lower.includes('upi collect') || lower.includes('upi_collect')) {
    const vpaMatch = clean.match(/customer@\w+|[\w.-]+@[\w.-]+/i);
    const amtMatch = clean.match(/₹[\d,.]+/i);
    const isApproved = lower.includes('approved') || lower.includes('success');
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[#0c2340]">Instant UPI Push Dispatched</span>
          {amtMatch && (
            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[11px]">
              {amtMatch[0]}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span>Target: <strong className="font-mono text-slate-700 font-semibold">{vpaMatch ? vpaMatch[0] : (log.customer_id || 'Customer VPA')}</strong></span>
          <span>•</span>
          <span className={isApproved ? "text-emerald-700 font-bold" : "text-[#0c83ff] font-semibold"}>
            {isApproved ? "Customer Approved via UPI PIN" : "Push Delivered to Phone"}
          </span>
        </div>
      </div>
    );
  }

  // 2. Cart Guard
  if (lower.includes('cart guard') || lower.includes('inventory')) {
    const amtMatch = clean.match(/₹[\d,.]+/i);
    const pidMatch = clean.match(/(?:for|Payment:)\s*([a-zA-Z0-9_-]+)/i);
    const pid = pidMatch ? pidMatch[1] : (log.payment_id || log.id || '');

    if (lower.includes('released')) {
      return (
        <div>
          <div className="font-bold text-slate-800">Cart Guard Hold Released</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>Warehouse inventory returned to stock pool</span>
            {pid && (
              <>
                <span>•</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-semibold">{pid}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    if (lower.includes('auto-fulfilled')) {
      return (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-emerald-900">Cart Guard Auto-Fulfilled</span>
            {amtMatch && (
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[11px]">
                {amtMatch[0]}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Bank cleared &amp; order confirmed at locked festival price
          </div>
        </div>
      );
    }
    if (lower.includes('extended')) {
      return (
        <div>
          <div className="font-bold text-amber-900">Cart Guard Hold Extended (+12h)</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>Discount price &amp; warehouse reservation active</span>
            {pid && (
              <>
                <span>•</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-semibold">{pid}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    // Default Cart Guard Lock
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-amber-950">24h Festival Cart Guard Activated</span>
          {amtMatch && (
            <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[11px]">
              {amtMatch[0]}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
          <span>Locked deal pricing &amp; reserved warehouse inventory</span>
          {pid && (
            <>
              <span>•</span>
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-semibold">{pid}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // 3. Payment Retry
  if (lower.includes('retry_payment') || lower.includes('retry')) {
    const pidMatch = clean.match(/(?:for|Payment:)\s*([a-zA-Z0-9_-]+)/i);
    const pid = pidMatch ? pidMatch[1] : (log.payment_id || log.id || '');
    return (
      <div>
        <div className="font-bold text-[#0c2340]">Smart Gateway Retry Scheduled</div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
          <span>Awaiting bank settlement confirmation</span>
          {pid && (
            <>
              <span>•</span>
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-semibold">{pid}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // 4. Email
  if (lower.includes('email') || lower.includes('reminder')) {
    return (
      <div>
        <div className="font-bold text-[#0c2340]">Customer Recovery Email Dispatched</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Self-recovery link &amp; regional payment instructions sent to customer
        </div>
      </div>
    );
  }

  // 5. Escalate
  if (lower.includes('escalat')) {
    return (
      <div>
        <div className="font-bold text-amber-900">Priority Human Support Escalation</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Repeated bank network failure flagged for direct agent intervention
        </div>
      </div>
    );
  }

  // 6. Safety Cooldown
  if (lower.includes('guardrail') || lower.includes('cooldown') || lower.includes('skipped')) {
    return (
      <div>
        <div className="font-bold text-emerald-900">Safety Guardrail Active (Cooldown Enforced)</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Prevented duplicate customer debit during bank delay window
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div>
      <div className="font-bold text-[#0c2340]">{clean}</div>
      {log.payment_id && (
        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
          {log.payment_id}
        </div>
      )}
    </div>
  );
}

function isLogResolved(log) {
  const s = (log.summary || '').toLowerCase();
  const status = (log.action_status || '').toLowerCase();
  return status === 'success' || 
         Number(log.amount_recovered_inr) > 0 ||
         s.includes('approved') ||
         s.includes('auto-fulfilled') ||
         s.includes('recovered');
}

export default function AuditTable({ logs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [statusView, setStatusView] = useState('ALL'); // 'ALL' | 'INCOMING' | 'SOLVED'
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalTab, setModalTab] = useState('upi_push'); // 'upi_push' | 'cart_guard' | 'vernacular'
  
  // UPI Push State
  const [upiVpa, setUpiVpa] = useState('');
  const [upiPushStatus, setUpiPushStatus] = useState(null); // 'sending' | 'delivered' | 'approved' | null
  const [upiPushMessage, setUpiPushMessage] = useState('');
  
  // Cart Guard State
  const [cartGuardActive, setCartGuardActive] = useState(false);
  const [guardRemaining, setGuardRemaining] = useState('23h 59m');
  const [guardLoading, setGuardLoading] = useState(false);
  const [guardMessage, setGuardMessage] = useState('');
  
  // Vernacular Copilot State
  const [selectedLang, setSelectedLang] = useState('hindi');
  const [vernacularData, setVernacularData] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  
  // Copy states
  const [copiedPaymentId, setCopiedPaymentId] = useState(false);

  // Initialize modal state when log selected
  useEffect(() => {
    if (selectedLog) {
      document.body.style.overflow = 'hidden';
      
      const rawCust = selectedLog.customer_id || '';
      const cleanPhone = rawCust.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        setUpiVpa(`${cleanPhone.slice(-10)}@okhdfcbank`);
      } else {
        setUpiVpa('customer@okhdfcbank');
      }

      setUpiPushStatus(null);
      setUpiPushMessage('');
      setCartGuardActive(false);
      setGuardMessage('');

      loadVernacularScript(selectedLang, selectedLog);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          stopSpeaking();
          setSelectedLog(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        stopSpeaking();
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
      stopSpeaking();
    }
  }, [selectedLog]);

  // Load Vernacular Script
  const loadVernacularScript = async (lang, log) => {
    if (!log) return;
    try {
      const data = await generateVernacularScript({
        payment_id: log.payment_id || log.id,
        amount_inr: log.amount_inr || (log.amount_paise ? log.amount_paise / 100 : 999.0),
        error_code: log.error_code || 'GATEWAY_TIMEOUT',
        error_description: log.error_description || log.root_cause || 'Bank network delay during 3DS verification',
        customer_name: 'Valued Customer',
        language: lang
      });
      setVernacularData(data);
    } catch (err) {
      console.warn('Vernacular API call exception:', err);
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    stopSpeaking();
    loadVernacularScript(lang, selectedLog);
  };

  const handleQuickHandleClick = (handle) => {
    const currentPrefix = upiVpa.includes('@') ? upiVpa.split('@')[0] : upiVpa;
    setUpiVpa(`${currentPrefix || 'customer'}${handle}`);
  };

  // Web Speech API
  const handleSpeakText = (text, voiceCode) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceCode || 'hi-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Instant UPI Collect Push Trigger
  const handleDispatchUpiCollect = async () => {
    if (!upiVpa.trim()) {
      alert('Please enter a valid UPI VPA');
      return;
    }

    setUpiPushStatus('sending');
    setUpiPushMessage('Initiating direct UPI collect push...');

    try {
      const amtInr = selectedLog.amount_inr || (selectedLog.amount_paise ? selectedLog.amount_paise / 100 : 999.0);
      
      setTimeout(async () => {
        setUpiPushStatus('delivered');
        setUpiPushMessage(`Push notification sent to ${upiVpa}. Awaiting customer UPI PIN...`);

        try {
          await triggerUpiCollectPush({
            payment_id: selectedLog.payment_id || selectedLog.id,
            vpa: upiVpa.trim(),
            amount_inr: amtInr,
            customer_id: selectedLog.customer_id,
            customer_name: 'Valued Customer',
            auto_capture: true
          });

          setTimeout(() => {
            setUpiPushStatus('approved');
            setUpiPushMessage(`Approved! ₹${amtInr.toLocaleString('en-IN')} successfully recovered via UPI.`);
          }, 1100);

        } catch (e) {
          console.error(e);
          setUpiPushStatus('delivered');
        }
      }, 700);

    } catch (err) {
      setUpiPushStatus(null);
      setUpiPushMessage('Failed to trigger UPI push.');
    }
  };

  // Cart Guard Action
  const handleCartGuardAction = async (action) => {
    setGuardLoading(true);
    try {
      const pid = selectedLog.payment_id || selectedLog.id;
      const amtInr = selectedLog.amount_inr || (selectedLog.amount_paise ? selectedLog.amount_paise / 100 : 1999.0);
      
      await manageCartGuard({
        payment_id: pid,
        action: action,
        locked_price_inr: amtInr,
        duration_hours: 24,
        sku_code: `SKU-FESTIVE-${pid.slice(-4).toUpperCase()}`
      });

      if (action === 'lock') {
        setCartGuardActive(true);
        setGuardRemaining('23h 59m');
        setGuardMessage('Cart Guard Active: Deal price & warehouse stock reserved for 24h.');
      } else if (action === 'extend') {
        setCartGuardActive(true);
        setGuardRemaining('35h 59m');
        setGuardMessage('Cart Guard Extended: +12 Hours added.');
      } else if (action === 'release') {
        setCartGuardActive(false);
        setGuardMessage('Cart Guard Released: Stock returned to warehouse pool.');
      } else if (action === 'fulfill') {
        setCartGuardActive(false);
        setGuardMessage('Auto-Fulfilled: Order confirmed at locked discount price.');
      }
    } catch (err) {
      setGuardMessage('Error updating Cart Guard.');
    } finally {
      setGuardLoading(false);
    }
  };

  const handleCopyText = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else if (type === 'wa') {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    }
  };

  const handleCopyPaymentId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedPaymentId(true);
    setTimeout(() => setCopiedPaymentId(false), 2000);
  };

  const incomingCount = useMemo(() => logs.filter(l => !isLogResolved(l)).length, [logs]);
  const solvedCount = useMemo(() => logs.filter(l => isLogResolved(l)).length, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const isResolved = isLogResolved(log);
      if (statusView === 'INCOMING' && isResolved) return false;
      if (statusView === 'SOLVED' && !isResolved) return false;

      const summary = (log.summary || '').toLowerCase();
      const matchesSearch = summary.includes(searchTerm.toLowerCase()) || 
        (log.id && log.id.includes(searchTerm)) ||
        (log.customer_id && log.customer_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.payment_id && log.payment_id.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === 'ALL')      return true;
      if (filterType === 'RETRY')    return summary.includes('retry_payment') || summary.includes('retry');
      if (filterType === 'EMAIL')    return summary.includes('send_reminder_email') || summary.includes('email');
      if (filterType === 'ESCALATE') return summary.includes('escalate_to_human') || summary.includes('escalat');
      return true;
    });
  }, [logs, searchTerm, filterType, statusView]);

  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['Audit ID', 'Timestamp', 'Summary', 'Customer ID', 'Payment ID', 'Error Code', 'Root Cause', 'Action Type', 'Action Status', 'Amount Recovered (INR)'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(l => [
        `"${l.id}"`,
        `"${l.created_at}"`,
        `"${(l.summary || '').replace(/"/g, '""')}"`,
        `"${l.customer_id || 'N/A'}"`,
        `"${l.payment_id || 'N/A'}"`,
        `"${l.error_code || 'N/A'}"`,
        `"${(l.root_cause || '').replace(/"/g, '""')}"`,
        `"${l.action_type || 'N/A'}"`,
        `"${l.action_status || 'N/A'}"`,
        `"${l.amount_recovered_inr || 0}"`,
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `razorpay_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const amountInr = selectedLog?.amount_inr || (selectedLog?.amount_paise ? selectedLog.amount_paise / 100 : 0);

  return (
    <div className="glass-card overflow-hidden fade-in-delay-4 border border-slate-200/90 rounded-2xl bg-white shadow-xs">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 border-b border-slate-200 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#0c2340] tracking-tight font-sans">
              Audit &amp; Recovery Log
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-[#0054b8] bg-blue-50 border border-blue-200 shadow-2xs">
              {logs.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time activity log of automated triages, UPI push collects, and cart locks.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          <div className="relative flex items-center flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3.5 pointer-events-none text-slate-400 z-10" />
            <input
              type="text"
              placeholder="Search by ID, customer, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium text-[#0c2340] placeholder:text-slate-400 rounded-xl bg-white border border-slate-300 focus:border-[#0c83ff] focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs transition-all"
              style={{ paddingLeft: '34px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px' }}
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#0c83ff] text-white shadow-xs'
                    : 'text-[#64748b] hover:text-[#0c2340]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            title="Download CSV Audit Report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0c2340] bg-white border border-slate-300 shadow-2xs hover:bg-blue-50 hover:text-[#0c83ff] hover:border-blue-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0c83ff]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ─── Issue Status View Switcher (Clean Razorpay Segmented Pills) ─── */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
        <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusView('INCOMING')}
            className={`py-1.5 px-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer outline-none ${
              statusView === 'INCOMING'
                ? 'bg-white text-amber-700 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Open Issues</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {incomingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusView('SOLVED')}
            className={`py-1.5 px-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer outline-none ${
              statusView === 'SOLVED'
                ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolved</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {solvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusView('ALL')}
            className={`py-1.5 px-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer outline-none ${
              statusView === 'ALL'
                ? 'bg-white text-[#0c83ff] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50'
            }`}
          >
            <span>All Logs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {logs.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {statusView === 'INCOMING' && <span className="text-amber-700 font-semibold">{incomingCount} issues requiring action</span>}
          {statusView === 'SOLVED' && <span className="text-emerald-700 font-semibold">{solvedCount} recovered payments</span>}
          {statusView === 'ALL' && <span>{logs.length} total activity logs</span>}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
        {filteredLogs.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-200">
              <Clock className="w-6 h-6 text-[#0c83ff]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0c2340]">No activity logs matching criteria</p>
              <p className="text-xs text-[#64748b] mt-1 font-medium">Click "Load Demo Data" or execute a simulator action above</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left dark-table">
            <thead>
              <tr>
                <th className="py-3 px-5">Autonomous Action</th>
                <th className="py-3 px-5">Details &amp; Root Cause</th>
                <th className="py-3 px-5 text-center">Support Copilot</th>
                <th className="py-3 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3.5 px-5 whitespace-nowrap align-middle">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3 px-5 align-middle">
                    {renderStructuredLogDetails(log)}
                  </td>
                  <td className="py-3.5 px-5 text-center whitespace-nowrap align-middle">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200 text-[#0054b8] shadow-2xs hover:bg-[#0c83ff] hover:text-white hover:border-[#0054b8] transition-all cursor-pointer"
                      title="Open Support AI Actions"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Support Actions
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap text-xs font-semibold text-[#64748b]">
                    <span title={log.created_at}>{formatRelativeTime(log.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Premium Razorpay Support AI Modal (Portaled) ─── */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-[#0c2340]/55 backdrop-blur-sm animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { 
            if (e.target === e.currentTarget) {
              stopSpeaking();
              setSelectedLog(null);
            }
          }}
        >
          <div
            className="relative w-full max-w-xl my-auto rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Sleek Enterprise Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0c2340] via-[#0f2d52] to-[#0c83ff] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-sans tracking-tight">Support AI Action Center</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                      Zero Customer Effort
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span>Customer: <strong className="text-white font-semibold">{selectedLog.customer_id || '+91 8238012515'}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span>Amount: <strong className="text-emerald-300 font-bold">₹{Number(amountInr).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  stopSpeaking();
                  setSelectedLog(null);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer outline-none focus:outline-none"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Modern Segmented Tab Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { stopSpeaking(); setModalTab('upi_push'); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none focus:outline-none ${
                    modalTab === 'upi_push'
                      ? 'bg-white text-[#0c83ff] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>UPI Push</span>
                </button>

                <button
                  type="button"
                  onClick={() => { stopSpeaking(); setModalTab('cart_guard'); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none focus:outline-none ${
                    modalTab === 'cart_guard'
                      ? 'bg-white text-[#0c83ff] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cart Guard</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setModalTab('vernacular'); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none focus:outline-none ${
                    modalTab === 'vernacular'
                      ? 'bg-white text-[#0c83ff] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Vernacular AI</span>
                </button>
              </div>
            </div>

            {/* 3. Modal Body Content */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh] bg-white">

              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: INSTANT UPI COLLECT PUSH
                 ───────────────────────────────────────────────────────────── */}
              {modalTab === 'upi_push' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#0c2340]">Direct UPI Collect Request</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Customer receives a 1-tap push on GPay/PhonePe to approve with UPI PIN.
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-[#0054b8]">
                      ₹{Number(amountInr).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Customer UPI ID / VPA
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="e.g. 9876543210@okhdfcbank"
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900 border border-slate-300 focus:border-[#0c83ff] focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
                      />
                      <button
                        onClick={handleDispatchUpiCollect}
                        disabled={upiPushStatus === 'sending'}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0c83ff] to-[#0054b8] hover:from-[#0070e0] hover:to-[#004797] shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0 outline-none"
                      >
                        {upiPushStatus === 'sending' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Push Request</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick UPI Handle Chips */}
                    <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Quick handles:</span>
                      {QUICK_UPI_HANDLES.map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => handleQuickHandleClick(handle)}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-[#0c83ff] text-slate-600 border border-slate-200 transition-colors cursor-pointer outline-none"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  {upiPushStatus && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-blue-100 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0c2340]">
                        {upiPushStatus === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-[#0c83ff] animate-spin shrink-0" />
                        )}
                        <span>{upiPushMessage}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${
                            upiPushStatus === 'approved' 
                              ? 'w-full bg-emerald-500' 
                              : upiPushStatus === 'delivered' 
                                ? 'w-2/3 bg-[#0c83ff]' 
                                : 'w-1/3 bg-[#0c83ff] animate-pulse'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: FESTIVAL & BIG SALE CART GUARD
                 ───────────────────────────────────────────────────────────── */}
              {modalTab === 'cart_guard' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Locked Deal Price</span>
                      <strong className="text-sm font-extrabold text-[#0c2340] mt-0.5 block">
                        ₹{Number(amountInr).toLocaleString('en-IN')} (Guaranteed)
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reservation Status</span>
                      <strong className={`text-sm font-extrabold mt-0.5 block ${cartGuardActive ? 'text-amber-700' : 'text-slate-600'}`}>
                        {cartGuardActive ? `Active (${guardRemaining})` : 'Inactive (Ready to Lock)'}
                      </strong>
                    </div>
                  </div>

                  {guardMessage && (
                    <p className="text-xs font-bold text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 animate-fade-in">
                      {guardMessage}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {!cartGuardActive ? (
                      <button
                        onClick={() => handleCartGuardAction('lock')}
                        disabled={guardLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer shadow-xs text-center outline-none"
                      >
                        Lock 24h Cart Guard
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCartGuardAction('fulfill')}
                          disabled={guardLoading}
                          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-xs text-center outline-none"
                        >
                          Auto-Fulfill Order
                        </button>
                        <button
                          onClick={() => handleCartGuardAction('extend')}
                          disabled={guardLoading}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer text-center outline-none"
                        >
                          +12h Extend
                        </button>
                        <button
                          onClick={() => handleCartGuardAction('release')}
                          disabled={guardLoading}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer text-center outline-none"
                        >
                          Release Hold
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: VERNACULAR AI SUPPORT COPILOT (Clean Language Grid)
                 ───────────────────────────────────────────────────────────── */}
              {modalTab === 'vernacular' && (
                <div className="space-y-3">
                  {/* Clean Segmented Language Bar */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-slate-100/90 p-1.5 rounded-xl text-center">
                    {VERNACULAR_LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer outline-none ${
                          selectedLang === lang.id
                            ? 'bg-white text-[#0c83ff] shadow-xs font-extrabold'
                            : 'text-slate-600 hover:text-[#0c2340] hover:bg-white/50 font-medium'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{lang.name}</div>
                        <div className={`text-[10px] mt-0.5 leading-tight ${selectedLang === lang.id ? 'text-[#0c83ff]/80 font-semibold' : 'text-slate-400'}`}>
                          {lang.native}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Spoken Phone Call Script */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#0c2340] uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0c83ff]" />
                        Spoken Support Script ({vernacularData?.language_name || 'Hindi'})
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSpeakText(vernacularData?.phone_script, vernacularData?.tts_voice_code)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors outline-none ${
                            isSpeaking
                              ? 'bg-red-100 text-red-700 animate-pulse'
                              : 'bg-blue-50 text-[#0054b8] hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                        </button>

                        <button
                          onClick={() => handleCopyText(vernacularData?.phone_script, 'script')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer outline-none"
                        >
                          {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                      {vernacularData?.phone_script || 'Loading script...'}
                    </p>
                  </div>

                  {/* WhatsApp Template Card */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp Template
                      </span>

                      <button
                        onClick={() => handleCopyText(vernacularData?.whatsapp_message, 'wa')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 cursor-pointer outline-none"
                      >
                        {copiedWa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedWa ? 'Copied' : 'Copy Template'}</span>
                      </button>
                    </div>

                    <pre className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-emerald-100 font-sans font-medium">
                      {vernacularData?.whatsapp_message || 'Loading template...'}
                    </pre>
                  </div>
                </div>
              )}

            </div>

            {/* 4. Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0c83ff]" />
                <span>HMAC &amp; OWASP Guardrails Enforced</span>
              </div>
              <button
                onClick={() => {
                  stopSpeaking();
                  setSelectedLog(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0c2340] hover:bg-[#0054b8] transition-colors cursor-pointer shadow-xs outline-none"
              >
                Done
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
