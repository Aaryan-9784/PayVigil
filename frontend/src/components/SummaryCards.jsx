import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle2, Sparkles, ArrowUpRight } from 'lucide-react';

export function formatINR(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(rupees);
}

export default function SummaryCards({ data, loading }) {
  const totalRecovered    = data?.total_recovered_paise || 0;
  const totalAtRisk       = data?.total_at_risk_paise   || 0;
  const recoveryRate      = data?.recovery_rate_pct     || 0;
  const totalActions      = data?.total_actions         || 0;
  const successfulActions = data?.successful_actions    || 0;
  const skippedCount      = data?.breakdown?.skipped_stopping_rule || 0;

  const cards = [
    {
      id: 'recovered',
      title: 'Recovered Revenue',
      value: loading ? '…' : formatINR(totalRecovered),
      subtext: `${successfulActions} payments rescued`,
      icon: TrendingUp,
      iconBg: 'bg-blue-50 text-[#0c83ff] border-blue-200',
      badge: 'Autonomous',
      badgeClass: 'bg-blue-50 text-[#0054b8] border-blue-200',
      topBorder: 'from-[#0c83ff] to-[#0052cc]',
      valueClass: 'text-[#0c2340]',
    },
    {
      id: 'at_risk',
      title: 'At-Risk Volume',
      value: loading ? '…' : formatINR(totalAtRisk),
      subtext: 'Total failed GMV detected',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'Degraded',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
      topBorder: 'from-amber-400 to-amber-600',
      valueClass: 'text-[#0c2340]',
    },
    {
      id: 'recovery_rate',
      title: 'Recovery Success Rate',
      value: loading ? '…' : `${recoveryRate}%`,
      subtext: `(${successfulActions}/${totalActions} settled)`,
      icon: Activity,
      iconBg: 'bg-sky-50 text-[#0c83ff] border-sky-200',
      badge: `${Math.round(recoveryRate)}% Rate`,
      badgeClass: 'bg-sky-50 text-[#0054b8] border-sky-200',
      topBorder: 'from-[#38bdf8] to-[#0c83ff]',
      valueClass: 'text-[#0c83ff]',
      isGauge: true,
    },
    {
      id: 'guardrails',
      title: 'Safety Guardrails',
      value: loading ? '…' : `${skippedCount}`,
      unit: 'Protected',
      subtext: 'Spam retries blocked safely',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Active',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      topBorder: 'from-emerald-400 to-emerald-600',
      valueClass: 'text-[#0c2340]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group"
          >
            {/* Top gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.topBorder}`} />

            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Metric Value */}
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-extrabold tracking-tight leading-tight ${card.valueClass}`}>
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-sm font-bold text-slate-500">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* Optional Progress Gauge for Recovery Rate */}
              {card.isGauge && (
                <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0c83ff] to-[#38bdf8] transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Footer / Subtext & Badge */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11.5px] text-slate-500 font-medium truncate pr-2">
                {card.subtext}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
