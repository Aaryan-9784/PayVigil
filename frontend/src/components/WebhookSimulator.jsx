import React, { useState } from 'react';
import { RotateCcw, Mail, AlertTriangle, ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { simulateWebhookEvent } from '../api';

const SCENARIOS = [
  {
    id: 'insufficient_funds',
    title: 'Temporary Card Decline',
    subtitle: 'System automatically schedules a retry',
    actionBadge: 'Auto-Retry',
    icon: RotateCcw,
    amount: 4999,
    accentClass: 'hover:border-emerald-300 hover:bg-emerald-50/50 text-emerald-900'
  },
  {
    id: 'expired_card',
    title: 'Expired Card',
    subtitle: 'Sends email to customer to update payment info',
    actionBadge: 'Customer Email',
    icon: Mail,
    amount: 2999,
    accentClass: 'hover:border-blue-300 hover:bg-blue-50/50 text-blue-900'
  },
  {
    id: 'fraud_suspected',
    title: 'High-Risk / Suspicious',
    subtitle: 'Alerts team for manual safety review',
    actionBadge: 'Support Review',
    icon: AlertTriangle,
    amount: 75000,
    accentClass: 'hover:border-amber-300 hover:bg-amber-50/50 text-amber-900'
  }
];

export default function WebhookSimulator({ onEventProcessed }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [lastError, setLastError] = useState(null);

  const handleSimulate = async (scenarioId, amount) => {
    setIsSimulating(true);
    setActiveScenario(scenarioId);
    setLastError(null);

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
    <div className="theme-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Try Sample Payment Scenarios</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any card below to see how the system handles different payment failures</p>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Interactive Test
        </span>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isRunning = isSimulating && activeScenario === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() => handleSimulate(scenario.id, scenario.amount)}
              disabled={isSimulating}
              className={`p-4 rounded-xl border border-slate-200 bg-white text-left transition-all duration-150 disabled:opacity-50 flex flex-col justify-between ${scenario.accentClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">{scenario.title}</span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{scenario.subtitle}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">₹{scenario.amount.toLocaleString('en-IN')}</span>
                <span className="font-medium text-blue-600 flex items-center gap-1">
                  {isRunning ? 'Processing...' : 'Run Test'} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Result Outcome */}
      {lastResult && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Test Result: Action <strong>{lastResult.agent_decision?.replace(/_/g, ' ')}</strong> executed successfully.
            </span>
          </div>

          {lastResult.amount_recovered_inr > 0 && (
            <div className="font-semibold text-emerald-700">
              Recovered: ₹{Number(lastResult.amount_recovered_inr).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {lastError}
        </div>
      )}
    </div>
  );
}

