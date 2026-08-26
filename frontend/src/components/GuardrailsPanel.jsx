import React from 'react';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function GuardrailsPanel({ guardrails }) {
  const maxRetries = guardrails?.max_retry_attempts ?? 3;
  const cooldownHours = guardrails?.retry_cooldown_hours ?? 12;

  return (
    <div className="theme-card p-5 sm:p-6 border-slate-200 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Enforced Stopping Rules & Guardrails</h2>
            <p className="text-xs text-slate-500 font-medium">Deterministic safety policies governing autonomous execution</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Enforced
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Rule 1: Max Retry Ceiling</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Max {maxRetries} Retries
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              If a payment fails $\ge {maxRetries}$ times, the agent automatically converts subsequent actions to <strong>human escalation</strong>.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span>Status:</span>
            <span>Active & Guarded</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Rule 2: Dynamic Cooldown Window</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {cooldownHours}h Cooldown
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Retries within {cooldownHours} hours on the same transaction are safely intercepted as <strong>skipped_stopping_rule</strong>.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span>Status:</span>
            <span>Active & Guarded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
