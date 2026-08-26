import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

export function formatINR(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Recovered */}
      <div className="theme-card-interactive p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recovered Revenue
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? '...' : formatINR(totalRecovered)}
        </div>
        <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{successfulActions} payments recovered</span>
        </div>
      </div>

      {/* 2. Total At Risk */}
      <div className="theme-card-interactive p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Failed Payments
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? '...' : formatINR(totalAtRisk)}
        </div>
        <div className="mt-2 text-xs text-slate-500 font-medium">
          Total failed volume detected
        </div>
      </div>

      {/* 3. Recovery Rate */}
      <div className="theme-card-interactive p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recovery Rate
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
          <span>{loading ? '...' : `${recoveryRate}%`}</span>
          <span className="text-xs text-slate-400 font-normal">
            ({successfulActions} of {totalActions})
          </span>
        </div>
        {/* Progress Bar */}
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 4. Guardrails */}
      <div className="theme-card-interactive p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Safety Limits
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? '...' : `${skippedCount} Prevented`}
        </div>
        <div className="mt-2 text-xs text-purple-600 font-medium">
          Protected from duplicate retries
        </div>
      </div>
    </div>
  );
}

