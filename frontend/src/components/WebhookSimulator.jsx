import React, { useState } from 'react';
import { Play, RotateCcw, Mail, AlertOctagon, Zap, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { simulateWebhookEvent } from '../api';

const BRANCH_TESTS = [
  {
    id: 'insufficient_funds',
    label: '1. Test Insufficient Funds',
    subtitle: 'Claude triggers Auto-Retry',
    badge: 'Retry Payment',
    color: 'emerald',
    icon: RotateCcw,
    defaultAmount: 4999,
    btnClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'expired_card',
    label: '2. Test Expired Card',
    subtitle: 'Claude triggers Customer Email',
    badge: 'Send Email',
    color: 'blue',
    icon: Mail,
    defaultAmount: 2999,
    btnClass: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'fraud_suspected',
    label: '3. Test Fraud / Dispute',
    subtitle: 'Claude triggers Human Escalation',
    badge: 'Escalate to Human',
    color: 'amber',
    icon: AlertOctagon,
    defaultAmount: 75000,
    btnClass: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
  }
];

export default function WebhookSimulator({ onEventProcessed }) {
  const [amountRupees, setAmountRupees] = useState(4999);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [lastError, setLastError] = useState(null);

  const handleSimulate = async (scenarioId, presetAmount) => {
    setIsSimulating(true);
    setActiveScenario(scenarioId);
    setLastError(null);

    try {
      const amountPaise = Math.round(Number(presetAmount || amountRupees || 4999) * 100);
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
    <div className="theme-card p-5 sm:p-6 border-slate-200 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Zap className="w-4 h-4 fill-blue-600/20" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">1-Click Payment Recovery Test Lab</h2>
            <p className="text-xs text-slate-500 font-medium">Trigger Razorpay failure webhooks to test all 3 Claude decision branches</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Interactive Demo
        </span>
      </div>

      {/* 3 Core Branch Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
        {BRANCH_TESTS.map((test) => {
          const Icon = test.icon;
          const isRunning = isSimulating && activeScenario === test.id;

          return (
            <button
              key={test.id}
              onClick={() => handleSimulate(test.id, test.defaultAmount)}
              disabled={isSimulating}
              className={`p-4 rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50 flex flex-col justify-between ${test.btnClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold">{test.label}</span>
                  <Icon className="w-4 h-4 opacity-80" />
                </div>
                <p className="text-[11px] opacity-80 font-medium leading-tight">{test.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-xs font-bold">
                <span>₹{test.defaultAmount.toLocaleString('en-IN')}</span>
                <span className="flex items-center gap-1 text-[11px]">
                  {isRunning ? 'Processing...' : 'Test Branch'} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Result Bar */}
      {lastResult && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-600 font-medium">Payment ID: <strong className="font-mono text-slate-800">{lastResult.payment_id}</strong></span>
          </div>

          <div className="flex items-center flex-wrap gap-3 font-semibold text-slate-700">
            <span>Agent Decision: <strong className="text-blue-700 font-mono">{lastResult.agent_decision}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-emerald-700 font-mono">{lastResult.action_status}</strong></span>
            <span>•</span>
            <span>Recovered: <strong className="text-emerald-700 font-mono font-bold">₹{Number(lastResult.amount_recovered_inr || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      )}

      {lastError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
          Error: {lastError}
        </div>
      )}
    </div>
  );
}
