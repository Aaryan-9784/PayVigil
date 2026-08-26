import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle2, IndianRupee } from 'lucide-react';

export function formatINR(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}

export default function SummaryCards({ data, loading }) {
  const totalRecovered = data?.total_recovered_paise || 0;
  const totalAtRisk = data?.total_at_risk_paise || 0;
  const recoveryRate = data?.recovery_rate_pct || 0;
  const totalActions = data?.total_actions || 0;
  const successfulActions = data?.successful_actions || 0;
  const skippedCount = data?.breakdown?.skipped_stopping_rule || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Recovered */}
      <div className="theme-card-interactive p-5 relative overflow-hidden group border-emerald-100/80">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100/70 transition-all -z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Revenue Recovered
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {loading ? '...' : formatINR(totalRecovered)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {successfulActions} won back
            </span>
            <span>via automated retry</span>
          </div>
        </div>
      </div>

      {/* 2. Total At Risk */}
      <div className="theme-card-interactive p-5 relative overflow-hidden group border-amber-100/80">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100/70 transition-all -z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Total Revenue At Risk
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {loading ? '...' : formatINR(totalAtRisk)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="text-slate-500">Failed webhook volume diagnosed</span>
          </div>
        </div>
      </div>

      {/* 3. Recovery Rate */}
      <div className="theme-card-interactive p-5 relative overflow-hidden group border-blue-100/80">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100/70 transition-all -z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Recovery Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono flex items-baseline gap-2">
            <span>{loading ? '...' : `${recoveryRate}%`}</span>
            <span className="text-xs text-slate-500 font-sans font-medium">
              ({successfulActions}/{totalActions})
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4. Guardrails Enforced */}
      <div className="theme-card-interactive p-5 relative overflow-hidden group border-purple-100/80">
        <div className="absolute top-0 right-0 w-28 h-28 bg-purple-50 rounded-full blur-2xl group-hover:bg-purple-100/70 transition-all -z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Guardrails Enforced
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {loading ? '...' : `${skippedCount} Intercepts`}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              Stopping Rules
            </span>
            <span>(12h Cooldown & Max 3)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
