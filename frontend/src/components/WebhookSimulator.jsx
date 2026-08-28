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
    accentColor: '#0c83ff',
    badgeClass: 'bg-blue-50 text-[#0054b8] border-blue-200',
    iconClass: 'bg-blue-50 text-[#0c83ff] border-blue-200',
    topBorder: 'border-t-4 border-t-[#0c83ff]',
  },
  {
    id: 'expired_card',
    category: 'card',
    title: 'Expired Card Details',
    subtitle: 'Dispatches automated personalized payment update email link.',
    actionBadge: 'Customer Email',
    icon: Mail,
    amount: 2999,
    accentColor: '#0052cc',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    iconClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    topBorder: 'border-t-4 border-t-[#0052cc]',
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
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    iconClass: 'bg-amber-50 text-amber-800 border-amber-200',
    topBorder: 'border-t-4 border-t-amber-500',
  },
  {
    id: 'subscription_mandate_failed',
    category: 'subscriptions',
    title: 'Subscription Mandate Fail',
    subtitle: 'Mandate retry sequencer detects transient bank clearing handoff error.',
    actionBadge: 'Mandate Retry',
    icon: RefreshCw,
    amount: 1499,
    accentColor: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    topBorder: 'border-t-4 border-t-emerald-500',
  },
  {
    id: 'b2b_invoice_overdue',
    category: 'subscriptions',
    title: 'B2B Invoice Overdue',
    subtitle: 'Automated B2B receivables chaser with Promise-to-Pay tracking.',
    actionBadge: 'Invoice Chaser',
    icon: FileText,
    amount: 45000,
    accentColor: '#0c2340',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    iconClass: 'bg-slate-50 text-slate-800 border-slate-200',
    topBorder: 'border-t-4 border-t-[#0c2340]',
  },
  {
    id: 'checkout_abandoned',
    category: 'subscriptions',
    title: 'Checkout Drop-off',
    subtitle: 'High-intent cart abandonment recovery with 1-click retry payment link.',
    actionBadge: 'Cart Recovery',
    icon: ShoppingCart,
    amount: 3499,
    accentColor: '#0c83ff',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    iconClass: 'bg-sky-50 text-sky-700 border-sky-200',
    topBorder: 'border-t-4 border-t-sky-500',
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
            <h2 className="text-base font-bold text-[#0c2340] tracking-tight">
              Interactive Scenario Simulator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase bg-blue-50 text-[#0054b8] border border-blue-200">
              Razorpay Sandbox
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1 font-medium">
            Trigger simulated payment failures, subscription mandates, and B2B invoices to test AI decisioning live
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {SCENARIO_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-[#0c2340] to-[#0c83ff] text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0c2340]'
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
              className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-left flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-1 disabled:opacity-50 group cursor-pointer ${scenario.topBorder}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-2xs ${scenario.badgeClass}`}
                  >
                    {scenario.actionBadge}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${scenario.iconClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0c83ff] transition-colors">
                  {scenario.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                  {scenario.subtitle}
                </p>
              </div>

              <div
                className="mt-5 pt-3.5 flex items-center justify-between text-xs border-t border-slate-100"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Transaction Value</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    ₹{scenario.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 group-hover:bg-[#0c83ff] group-hover:text-white text-[#0054b8] border border-blue-200 group-hover:border-[#0c83ff] shadow-2xs transition-all">
                  {isRunning ? (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <>Run Simulation <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></>
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
          className="mt-4 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-blue-50 border border-blue-200 shadow-sm"
        >
          <div className="flex items-center gap-2.5 font-medium text-[#0054b8]">
            <CheckCircle2 className="w-5 h-5 text-[#0c83ff] shrink-0" />
            <span className="text-slate-900">
              Autonomous Action <strong className="text-[#0054b8] uppercase tracking-wide px-2 py-0.5 rounded bg-blue-100/80 border border-blue-200 font-bold">{lastResult.agent_decision?.replace(/_/g, ' ')}</strong> triggered &amp; logged.
            </span>
          </div>
          {lastResult.amount_recovered_inr > 0 && (
            <div className="font-bold text-sm px-3 py-1 rounded-lg bg-[#0c83ff] text-white shadow-xs">
              Recovered: ₹{Number(lastResult.amount_recovered_inr).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div
          className="mt-4 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 bg-red-50 border border-red-200 text-red-900"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{lastError}</span>
        </div>
      )}
    </div>
  );
}
