import React from 'react';
import { 
  Building2, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  Wifi, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';

const GATEWAY_ICONS = {
  hdfc: Building2,
  sbin: Building2,
  icic: Building2,
  utib: Building2,
  upi: Zap,
  cards: ShieldCheck
};

export default function BankHealthMatrix({ bankHealth = [] }) {
  // Fallback default gateways if data not loaded yet
  const defaultGateways = [
    {
      id: 'hdfc',
      name: 'HDFC Bank Gateway',
      short_name: 'HDFC',
      type: 'Netbanking / Cards',
      uptime_pct: 99.4,
      avg_latency_ms: 195,
      failure_count: 0,
      status: 'operational',
      ai_insight: '2FA handoff stable; AI Smart Retry queue operational.'
    },
    {
      id: 'sbin',
      name: 'State Bank of India',
      short_name: 'SBI',
      type: 'UPI / Netbanking',
      uptime_pct: 98.2,
      avg_latency_ms: 290,
      failure_count: 0,
      status: 'operational',
      ai_insight: 'Clearing window normal; auto-scheduled retry active.'
    },
    {
      id: 'icic',
      name: 'ICICI Bank Network',
      short_name: 'ICICI',
      type: 'Cards / 3DS 2.0',
      uptime_pct: 99.7,
      avg_latency_ms: 160,
      failure_count: 0,
      status: 'operational',
      ai_insight: 'Card tokenization auth passing; OTP latency < 2s.'
    },
    {
      id: 'utib',
      name: 'Axis Bank Rails',
      short_name: 'Axis',
      type: 'e-Mandate / Gateway',
      uptime_pct: 99.1,
      avg_latency_ms: 220,
      failure_count: 0,
      status: 'operational',
      ai_insight: 'e-Mandate clearing channel responsive.'
    },
    {
      id: 'upi',
      name: 'UPI Network (NPCI)',
      short_name: 'UPI / NPCI',
      type: 'Instant VPA / QR',
      uptime_pct: 99.8,
      avg_latency_ms: 110,
      failure_count: 0,
      status: 'operational',
      ai_insight: 'NPCI switch healthy; instant deep-link routing enabled.'
    },
    {
      id: 'cards',
      name: 'Global Card Rails',
      short_name: 'Visa / MC / RuPay',
      type: 'International & Domestic',
      uptime_pct: 98.9,
      avg_latency_ms: 240,
      failure_count: 0,
      status: 'operational',
      ai_insight: 'Bilingual card update emails dispatched for expired credentials.'
    }
  ];

  const gateways = bankHealth.length > 0 ? bankHealth : defaultGateways;
  const operationalCount = gateways.filter(g => g.status === 'operational').length;
  const totalCount = gateways.length;

  return (
    <div className="glass-card p-6 border border-slate-200/90 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm space-y-5">
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#0c83ff] shadow-xs">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0c2340] tracking-tight">
                Bank &amp; Payment Gateway Health Index
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {operationalCount}/{totalCount} Rails Operational
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated failure diagnostics &amp; gateway telemetry across Indian banking rails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-Time NPCI &amp; Bank Telemetry</span>
        </div>
      </div>

      {/* ── Gateways Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map((gw) => {
          const Icon = GATEWAY_ICONS[gw.id] || Building2;
          const isOperational = gw.status === 'operational';
          const isDegraded = gw.status === 'degraded';
          const isDowntime = gw.status === 'downtime';

          const statusColor = isOperational 
            ? 'emerald' 
            : isDegraded 
              ? 'amber' 
              : 'red';

          return (
            <div
              key={gw.id}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                isOperational 
                  ? 'bg-gradient-to-b from-white to-slate-50/50 border-slate-200 hover:border-blue-300' 
                  : isDegraded 
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300' 
                    : 'bg-red-50/40 border-red-200 hover:border-red-300'
              }`}
            >
              {/* Top Accent Line */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  isOperational 
                    ? 'from-emerald-400 to-teal-500' 
                    : isDegraded 
                      ? 'from-amber-400 to-orange-500' 
                      : 'from-red-500 to-rose-600'
                }`} 
              />

              {/* Gateway Title & Status */}
              <div className="flex items-start justify-between gap-2 mt-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isOperational 
                      ? 'bg-blue-50 border-blue-100 text-[#0c83ff]' 
                      : isDegraded 
                        ? 'bg-amber-100/70 border-amber-200 text-amber-700' 
                        : 'bg-red-100/70 border-red-200 text-red-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0c2340] leading-tight">
                      {gw.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">{gw.type}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`relative flex h-2 w-2`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOperational ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      isOperational ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isOperational ? 'text-emerald-700' : isDegraded ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {gw.status}
                  </span>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50/80 rounded-lg p-2 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uptime</p>
                  <p className="text-xs font-extrabold text-[#0c2340] mt-0.5">
                    {gw.uptime_pct}%
                  </p>
                </div>
                <div className="bg-slate-50/80 rounded-lg p-2 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Latency</p>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">
                    {gw.avg_latency_ms}ms
                  </p>
                </div>
                <div className="bg-slate-50/80 rounded-lg p-2 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Failures</p>
                  <p className={`text-xs font-extrabold mt-0.5 ${gw.failure_count > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {gw.failure_count}
                  </p>
                </div>
              </div>

              {/* AI Recovery Insight */}
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-600 bg-blue-50/40 rounded-lg p-2 border border-blue-100/60">
                <Sparkles className="w-3.5 h-3.5 text-[#0c83ff] shrink-0 mt-0.5" />
                <span className="leading-tight text-[11px] text-slate-600 font-medium">
                  {gw.ai_insight}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
