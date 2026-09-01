import React, { useState } from 'react';
import { 
  Radio, 
  Sparkles, 
  ArrowUpRight, 
  RotateCcw, 
  Mail, 
  AlertOctagon, 
  CheckCircle2, 
  Zap, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Trash2 
} from 'lucide-react';

const ACTION_BADGES = {
  retry_payment: {
    label: 'Smart Retry',
    color: 'bg-blue-50 text-[#0054b8] border-blue-200',
    icon: RotateCcw
  },
  send_reminder_email: {
    label: 'Customer Email',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Mail
  },
  escalate_to_human: {
    label: 'Human Review',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: AlertOctagon
  },
  revenue_recovered: {
    label: 'Revenue Rescued',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2
  }
};

export default function LiveEventFeed({ liveEvents = [], onClearEvents }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (liveEvents.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-500/5 via-slate-50 to-blue-500/5 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-semibold text-slate-700">
            Live WebSocket Ingestion Stream:
          </span>
          <span className="text-slate-500 hidden sm:inline">
            Listening for raw Razorpay webhook failures &amp; AI triage decisions in real time...
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#0c83ff] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
          0.0ms Latency
        </span>
      </div>
    );
  }

  return (
    <div className="border border-blue-200/90 bg-gradient-to-br from-white via-blue-50/20 to-slate-50/60 rounded-2xl p-4 shadow-xs transition-all">
      {/* ── Feed Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <h3 className="text-xs font-black tracking-tight text-[#0c2340] uppercase">
            ⚡ Live Triage Event Feed ({liveEvents.length})
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/70 text-[#0054b8] border border-blue-200">
            WebSocket Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClearEvents && (
            <button
              onClick={onClearEvents}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear live feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-slate-500 hover:text-[#0c2340] hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Feed Stream Items ── */}
      {isExpanded && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
          {liveEvents.slice(0, 8).map((evt, idx) => {
            const isRecovery = evt.type === 'revenue_recovered';
            const actionKey = isRecovery ? 'revenue_recovered' : (evt.data?.action_type || 'retry_payment');
            const badge = ACTION_BADGES[actionKey] || ACTION_BADGES.retry_payment;
            const Icon = badge.icon;
            const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now';

            return (
              <div
                key={evt.id || idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                  isRecovery
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 shadow-2xs'
                    : 'bg-white border-slate-200/90 text-slate-700 shadow-2xs hover:border-blue-300'
                }`}
                style={{ animation: 'fadeSlideUp 0.3s ease forwards' }}
              >
                {/* Left details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                    isRecovery ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-blue-50 border-blue-200 text-[#0c83ff]'
                  }`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[#0c2340]">
                        {evt.data?.payment_id ? `${evt.data.payment_id.slice(-8)}` : 'pay_live'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-extrabold text-[#0c2340]">
                        ₹{Number(evt.data?.amount_inr || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 truncate max-w-[200px] text-[11px]">
                        {evt.data?.root_cause || evt.data?.summary || 'Triage event received'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right badges & time */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">
                    {timeStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
