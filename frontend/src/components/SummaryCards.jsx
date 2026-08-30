import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle2, Sparkles, ArrowUpRight, ChevronRight, X, User, CreditCard, RotateCcw, Mail, AlertOctagon, Copy } from 'lucide-react';

export function formatINR(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(rupees);
}

export default function SummaryCards({ data, loading }) {
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  const totalRecovered    = data?.total_recovered_paise || 0;
  const totalAtRisk       = data?.total_at_risk_paise   || 0;
  const recoveryRate      = data?.recovery_rate_pct     || 0;
  const totalActions      = data?.total_actions         || 0;
  const successfulActions = data?.successful_actions    || 0;
  const skippedCount      = data?.breakdown?.skipped_stopping_rule || 0;
  const atRiskOrders      = data?.at_risk_orders || [];

  // Lock body scroll and handle ESC key when modal is open
  useEffect(() => {
    if (showBreakdownModal) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setShowBreakdownModal(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [showBreakdownModal]);

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

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
      title: 'Active At-Risk Volume',
      value: loading ? '…' : formatINR(totalAtRisk),
      subtext: totalAtRisk === 0 
        ? 'All failed payments recovered' 
        : `${data?.at_risk_orders_count || 1} unresolved at-risk ${(data?.at_risk_orders_count || 1) === 1 ? 'order' : 'orders'}`,
      icon: totalAtRisk === 0 ? ShieldCheck : AlertTriangle,
      iconBg: totalAtRisk === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      badge: totalAtRisk === 0 ? 'All Clear' : 'Degraded',
      badgeClass: totalAtRisk === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200',
      topBorder: totalAtRisk === 0 ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600',
      valueClass: totalAtRisk === 0 ? 'text-emerald-700' : 'text-[#0c2340]',
      hasBreakdown: totalAtRisk > 0 && atRiskOrders.length > 0,
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => {
                if (card.hasBreakdown) setShowBreakdownModal(true);
              }}
              className={`rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group ${card.hasBreakdown ? 'cursor-pointer hover:border-amber-300' : ''}`}
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

              {/* Footer / Subtext & Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11.5px] text-slate-500 font-medium truncate pr-2">
                  {card.subtext}
                </span>
                
                {card.id === 'at_risk' && totalAtRisk > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBreakdownModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                    title="View individual at-risk orders list"
                  >
                    <span>View List</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* React Portal: Separate At-Risk Orders Breakdown Modal for Admin & Support */}
      {showBreakdownModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Deep Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowBreakdownModal(false)} 
          />

          {/* Modal Container */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-base font-bold text-[#0c2340]">Active At-Risk Orders Queue</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {atRiskOrders.length} {atRiskOrders.length === 1 ? 'Order' : 'Orders'} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actionable triage list for Customer Support &amp; Administrator review
                </p>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal List of Individual Orders */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {atRiskOrders.map((order, idx) => {
                const shortPayId = (order.latest_payment_id || '').slice(-8);
                const recoveryLink = `https://rzp.io/i/${shortPayId || order.order_id || 'recovery'}`;
                const isCopied = copiedOrderId === (order.order_id || idx);

                return (
                  <div 
                    key={order.order_id || idx} 
                    className="rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all overflow-hidden"
                  >
                    {/* Card Top: Customer, Amount & Retries */}
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-extrabold text-xs shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#0c2340]">
                              {order.customer_id}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {order.order_id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Latest Payment ID: {order.latest_payment_id}
                          </span>
                        </div>
                      </div>

                      {/* Amount & Failure Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-[#0c2340] leading-none">
                          {formatINR(order.amount_paise)}
                        </div>
                        <span className="inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          {order.fail_count} Failed {order.fail_count === 1 ? 'Attempt' : 'Attempts'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body: Root Cause & AI Resolution Path */}
                    <div className="p-4 space-y-2.5 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-500 shrink-0 w-24">Root Cause:</span>
                        <span className="text-slate-700 font-medium leading-relaxed">
                          {order.error_description || order.error_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500 shrink-0 w-24">AI Action:</span>
                        <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0054b8] border border-blue-200">
                          {order.latest_action === 'send_reminder_email' ? '✉️ 1-Click Reminder Dispatched' : (order.latest_action === 'retry_payment' ? '🔁 Smart Gateway Retry Active' : '🚨 Escalate to Support')}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom: 1-Click Recovery Action */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] truncate mr-2">
                        <span className="text-slate-400">Link:</span>
                        <span className="text-[#0c83ff] truncate">{recoveryLink}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(recoveryLink, order.order_id || idx)}
                        className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs ${
                          isCopied 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-[#0c83ff] text-white hover:bg-[#006bd8] hover:shadow-xs'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy 1-Click Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Total Unresolved GMV at Risk: <strong className="text-[#0c2340] text-sm">{formatINR(totalAtRisk)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowBreakdownModal(false)}
                className="px-5 py-2 rounded-xl font-bold bg-[#0c2340] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
