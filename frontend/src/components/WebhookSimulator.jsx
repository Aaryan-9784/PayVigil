import React, { useState } from 'react';
import { RotateCcw, Mail, AlertTriangle, ArrowRight, CheckCircle2, Zap, RefreshCw, FileText, ShoppingCart } from 'lucide-react';
import { simulateWebhookEvent } from '../api';

const SCENARIO_CATEGORIES = [
  { id: 'all', label: 'All Scenarios' },
  { id: 'card', label: '💳 Cards & 2FA' },
  { id: 'subscriptions', label: '🔁 Subscriptions & B2B' },
];

const SCENARIOS = [
  {
    id: 'insufficient_funds',
    category: 'card',
    title: 'Temporary Card Decline',
    subtitle: 'System autonomously schedules an intelligent smart retry with bank cooldown.',
    actionBadge: 'Auto-Retry',
    icon: RotateCcw,
    amount: 4999,
    accentColor: '#059669',
    glowColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(209,250,229,0.6) 0%, rgba(255,255,255,0.95) 75%)',
    badgeBg: 'rgba(209,250,229,0.9)',
    badgeBorder: 'rgba(16,185,129,0.35)',
    badgeText: '#047857'
  },
  {
    id: 'expired_card',
    category: 'card',
    title: 'Expired Card Details',
    subtitle: 'Dispatches automated personalized payment update email link.',
    actionBadge: 'Customer Email',
    icon: Mail,
    amount: 2999,
    accentColor: '#ca8a04',
    glowColor: 'rgba(234,179,8,0.2)',
    borderColor: 'rgba(234,179,8,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(254,249,195,0.7) 0%, rgba(255,255,255,0.95) 75%)',
    badgeBg: 'rgba(254,240,138,0.85)',
    badgeBorder: 'rgba(234,179,8,0.45)',
    badgeText: '#854d0e'
  },
  {
    id: 'fraud_suspected',
    category: 'card',
    title: 'High-Risk / Suspicious',
    subtitle: 'Pauses auto-recovery and immediately alerts risk team on Slack for review.',
    actionBadge: 'Support Review',
    icon: AlertTriangle,
    amount: 75000,
    accentColor: '#b45309',
    glowColor: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(254,243,199,0.7) 0%, rgba(255,255,255,0.95) 75%)',
    badgeBg: 'rgba(254,243,199,0.95)',
    badgeBorder: 'rgba(245,158,11,0.45)',
    badgeText: '#92400e'
  },
  {
    id: 'subscription_mandate_failed',
    category: 'subscriptions',
    title: 'Subscription Mandate Fail',
    subtitle: 'Mandate retry sequencer detects transient bank clearing handoff error.',
    actionBadge: 'Mandate Retry',
    icon: RefreshCw,
    amount: 1499,
    accentColor: '#059669',
    glowColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(209,250,229,0.6) 0%, rgba(255,255,255,0.95) 75%)',
    badgeBg: 'rgba(209,250,229,0.9)',
    badgeBorder: 'rgba(16,185,129,0.35)',
    badgeText: '#047857'
  },
  {
    id: 'b2b_invoice_overdue',
    category: 'subscriptions',
    title: 'B2B Invoice Overdue',
    subtitle: 'Automated B2B receivables chaser with Promise-to-Pay tracking.',
    actionBadge: 'Invoice Chaser',
    icon: FileText,
    amount: 45000,
    accentColor: '#ca8a04',
    glowColor: 'rgba(234,179,8,0.2)',
    borderColor: 'rgba(234,179,8,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(254,249,195,0.7) 0%, rgba(255,255,255,0.95) 75%)',
    badgeBg: 'rgba(254,240,138,0.85)',
    badgeBorder: 'rgba(234,179,8,0.45)',
    badgeText: '#854d0e'
  },
  {
    id: 'checkout_abandoned',
    category: 'subscriptions',
    title: 'Checkout Drop-off',
    subtitle: 'High-intent cart abandonment recovery with 1-click retry payment link.',
    actionBadge: 'Cart Recovery',
    icon: ShoppingCart,
    amount: 3499,
    accentColor: '#ca8a04',
    glowColor: 'rgba(234,179,8,0.2)',
    borderColor: 'rgba(234,179,8,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(254,249,195,0.7) 0%, rgba(255,255,255,0.95) 75%)',
    badgeBg: 'rgba(254,240,138,0.85)',
    badgeBorder: 'rgba(234,179,8,0.45)',
    badgeText: '#854d0e'
  }
];

export default function WebhookSimulator({ onEventProcessed }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastResult, setLastResult] = useState(null);
  const [lastError, setLastError] = useState(null);

  const filteredScenarios = SCENARIOS.filter(s => selectedCategory === 'all' || s.category === selectedCategory);

  const handleSimulate = async (scenarioId, amount) => {
    setIsSimulating(true);
    setActiveScenario(scenarioId);
    setLastError(null);
    setLastResult(null);

    try {
      const amountPaise = Math.round(Number(amount) * 100);
      const res = await simulateWebhookEvent(scenarioId, amountPaise, 'cust_demo_user');
      setLastResult(res);
      if (onEventProcessed) onEventProcessed();
    } catch (err) {
      setLastError(err.response?.data?.detail || err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="glass-card p-6 fade-in-delay-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Interactive Scenario Simulator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase bg-yellow-100 text-yellow-800 border border-yellow-300">
              Track 03 Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Trigger simulated payment failures, subscription mandates, and B2B invoices to test AI decisioning live
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-yellow-200 shadow-2xs">
          {SCENARIO_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isRunning = isSimulating && activeScenario === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() => handleSimulate(scenario.id, scenario.amount)}
              disabled={isSimulating}
              className="p-5 rounded-2xl text-left flex flex-col justify-between transition-all duration-200 disabled:opacity-50 group cursor-pointer"
              style={{
                background: scenario.bgGradient,
                border: `1px solid ${scenario.borderColor}`,
                boxShadow: '0 2px 12px -2px rgba(161, 98, 7, 0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 10px 24px -2px ${scenario.glowColor}`;
                e.currentTarget.style.borderColor = scenario.accentColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 12px -2px rgba(161, 98, 7, 0.05)';
                e.currentTarget.style.borderColor = scenario.borderColor;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{
                      background: scenario.badgeBg,
                      border: `1px solid ${scenario.badgeBorder}`,
                      color: scenario.badgeText,
                    }}
                  >
                    {scenario.actionBadge}
                  </span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: scenario.badgeBg, color: scenario.badgeText }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  {scenario.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                  {scenario.subtitle}
                </p>
              </div>

              <div
                className="mt-5 pt-3.5 flex items-center justify-between text-xs"
                style={{ borderTop: '1px solid rgba(234, 179, 8, 0.2)' }}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Transaction Value</span>
                  <span className="text-sm font-extrabold" style={{ color: scenario.accentColor }}>
                    ₹{scenario.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 group-hover:bg-white text-slate-800 border border-yellow-200 shadow-sm transition-colors">
                  {isRunning ? (
                    <span style={{ color: scenario.accentColor }} className="flex items-center gap-1">
                      <Zap className="w-3 h-3 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <>Run Simulation <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Result Outcome */}
      {lastResult && (
        <div
          className="mt-4 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          style={{
            background: 'linear-gradient(135deg, rgba(209,250,229,0.8) 0%, rgba(254,249,195,0.7) 100%)',
            border: '1px solid rgba(16,185,129,0.35)',
            boxShadow: '0 4px 14px rgba(16,185,129,0.1)'
          }}
        >
          <div className="flex items-center gap-2.5 font-medium text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-slate-800">
              Autonomous Action <strong className="text-emerald-800 uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-200 border border-emerald-300 font-bold">{lastResult.agent_decision?.replace(/_/g, ' ')}</strong> triggered & logged.
            </span>
          </div>
          {lastResult.amount_recovered_inr > 0 && (
            <div className="font-bold text-sm px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              Recovered: ₹{Number(lastResult.amount_recovered_inr).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div
          className="mt-4 p-4 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: 'rgba(254,226,226,0.85)', border: '1px solid rgba(239,68,68,0.35)', color: '#991b1b' }}
        >
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{lastError}</span>
        </div>
      )}
    </div>
  );
}
