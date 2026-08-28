import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle2, Sparkles, ArrowUpRight } from 'lucide-react';

export function formatINR(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(rupees);
}

export default function SummaryCards({ data, loading }) {
  const totalRecovered   = data?.total_recovered_paise || 0;
  const totalAtRisk      = data?.total_at_risk_paise   || 0;
  const recoveryRate     = data?.recovery_rate_pct     || 0;
  const totalActions     = data?.total_actions         || 0;
  const successfulActions= data?.successful_actions    || 0;
  const skippedCount     = data?.breakdown?.skipped_stopping_rule || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* ── 1. Recovered Revenue: Razorpay Dark Space Navy Hero Card ── */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer group shadow-card"
        style={{
          background: 'linear-gradient(135deg, #02042b 0%, #0c2340 60%, #0054b8 100%)',
          border: '1px solid rgba(12, 131, 255, 0.35)',
        }}
      >
        {/* Razorpay signature ambient light */}
        <div
          className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none opacity-40 blur-xl"
          style={{ background: '#0c83ff' }}
        />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-200">
            Recovered Revenue
          </span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 border border-blue-400/30 text-cyan-300">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight text-white relative z-10 leading-tight">
          {loading ? <span className="shimmer bg-white/20" /> : formatINR(totalRecovered)}
        </div>

        {!loading && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-cyan-300 relative z-10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{successfulActions} transactions recovered autonomously</span>
          </div>
        )}
      </div>

      {/* ── 2. Failed Payments Volume: Crisp Razorpay White Card ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-1 relative overflow-hidden"
        style={{
          borderLeft: '4px solid #f59e0b',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
            At-Risk Volume
          </span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {loading ? <span className="shimmer" /> : formatINR(totalAtRisk)}
        </div>

        {!loading && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total failed GMV detected</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-200">
              Degraded
            </span>
          </div>
        )}
      </div>

      {/* ── 3. Recovery Success Rate: Razorpay Electric Blue Gauge ── */}
      <div className="glass-card-interactive p-5 fade-in-delay-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0c2340]">
            Recovery Success Rate
          </span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-200 text-[#0c83ff]">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-3xl font-extrabold tracking-tight text-[#0c2340] leading-tight">
            {loading ? '…' : `${recoveryRate}%`}
          </span>
          {!loading && (
            <span className="text-xs font-semibold text-slate-500">
              ({successfulActions}/{totalActions})
            </span>
          )}
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: loading ? '0%' : `${Math.min(recoveryRate,100)}%` }} />
        </div>
      </div>

      {/* ── 4. Safety Guardrails: Razorpay Shield Card ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-3"
        style={{
          borderLeft: '4px solid #10b981',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0c2340]">
            Safety Guardrails
          </span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight text-[#0c2340] leading-tight">
          {loading ? <span className="shimmer" /> : `${skippedCount}`}
          <span className="text-lg font-bold text-slate-600 ml-1.5">Protected</span>
        </div>

        {!loading && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Spam charges throttled safely</span>
          </div>
        )}
      </div>

    </div>
  );
}
