import React, { useState } from 'react';
import { RotateCcw, Mail, AlertTriangle, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { simulateWebhookEvent } from '../api';

const SCENARIOS = [
  {
    id: 'insufficient_funds',
    title: 'Temporary Card Decline',
    subtitle: 'System automatically schedules an intelligent smart retry.',
    actionBadge: 'Auto-Retry',
    icon: RotateCcw,
    amount: 4999,
    accentColor: '#34d399',
    glowColor: 'rgba(52,211,153,0.3)',
    borderColor: 'rgba(52,211,153,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(13,18,35,0.85) 80%)',
    badgeBg: 'rgba(52,211,153,0.18)',
    badgeBorder: 'rgba(52,211,153,0.4)',
    badgeText: '#6ee7b7'
  },
  {
    id: 'expired_card',
    title: 'Expired Card',
    subtitle: 'Dispatches automated personalized payment update email link.',
    actionBadge: 'Customer Email',
    icon: Mail,
    amount: 2999,
    accentColor: '#818cf8',
    glowColor: 'rgba(99,102,241,0.3)',
    borderColor: 'rgba(99,102,241,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(13,18,35,0.85) 80%)',
    badgeBg: 'rgba(99,102,241,0.18)',
    badgeBorder: 'rgba(99,102,241,0.4)',
    badgeText: '#a5b4fc'
  },
  {
    id: 'fraud_suspected',
    title: 'High-Risk / Suspicious',
    subtitle: 'Pauses auto-recovery and immediately alerts risk team for manual review.',
    actionBadge: 'Support Review',
    icon: AlertTriangle,
    amount: 75000,
    accentColor: '#fbbf24',
    glowColor: 'rgba(245,158,11,0.3)',
    borderColor: 'rgba(251,191,36,0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(13,18,35,0.85) 80%)',
    badgeBg: 'rgba(245,158,11,0.18)',
    badgeBorder: 'rgba(251,191,36,0.4)',
    badgeText: '#fde68a'
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              Interactive Scenario Simulator
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Test
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Trigger simulated Razorpay webhook events to test autonomous decision engine in real-time
          </p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario) => {
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
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 10px 30px ${scenario.glowColor}`;
                e.currentTarget.style.borderColor = scenario.accentColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = scenario.borderColor;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
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
                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner"
                    style={{ background: scenario.badgeBg, color: scenario.badgeText }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                  {scenario.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                  {scenario.subtitle}
                </p>
              </div>

              <div
                className="mt-5 pt-3.5 flex items-center justify-between text-xs"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Impact</span>
                  <span className="text-sm font-extrabold" style={{ color: scenario.accentColor }}>
                    ₹{scenario.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 text-slate-200 transition-colors">
                  {isRunning ? (
                    <span style={{ color: scenario.accentColor }} className="flex items-center gap-1">
                      <Zap className="w-3 h-3 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <>Run Simulation <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" /></>
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
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(13,18,35,0.9) 100%)',
            border: '1px solid rgba(52,211,153,0.35)',
            boxShadow: '0 4px 20px rgba(16,185,129,0.15)'
          }}
        >
          <div className="flex items-center gap-2.5 font-medium text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-slate-200">
              Autonomous Action <strong className="text-emerald-300 uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/20">{lastResult.agent_decision?.replace(/_/g, ' ')}</strong> triggered & logged.
            </span>
          </div>
          {lastResult.amount_recovered_inr > 0 && (
            <div className="font-bold text-sm px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Recovered: ₹{Number(lastResult.amount_recovered_inr).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div
          className="mt-4 p-4 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{lastError}</span>
        </div>
      )}
    </div>
  );
}
