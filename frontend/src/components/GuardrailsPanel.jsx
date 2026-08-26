import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function GuardrailsPanel({ guardrails }) {
  const maxRetries = guardrails?.max_retry_attempts ?? 3;
  const cooldownHours = guardrails?.retry_cooldown_hours ?? 12;

  return (
    <div className="theme-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Safety Rules & Protection</h2>
            <p className="text-xs text-slate-500">Automated limits to protect customer experience</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Rule 1 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Rule 1: Maximum Retries</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Max {maxRetries} Attempts
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If a payment fails {maxRetries} times, automated retries stop immediately and the case is forwarded to support for personal review.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-emerald-600 font-medium">
            <span>Status:</span>
            <span>Active & Enforced</span>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Rule 2: Retry Cooldown</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {cooldownHours}h Window
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Any retry attempt within {cooldownHours} hours of a previous attempt on the same payment is safely delayed to avoid duplicate charges.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-emerald-600 font-medium">
            <span>Status:</span>
            <span>Active & Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}

