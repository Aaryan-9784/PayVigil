import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function GuardrailsPanel({ guardrails }) {
  const maxRetries = guardrails?.max_retry_attempts ?? 3;
  const cooldownHours = guardrails?.retry_cooldown_hours ?? 12;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="icon-box icon-box-yellow">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Safety Rules &amp; Protection</h2>
            <p className="text-xs text-slate-500">Automated limits to protect customer experience</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Rule 1 */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'rgba(254, 249, 195, 0.45)', borderColor: 'rgba(234, 179, 8, 0.3)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Rule 1: Maximum Retries</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-yellow-200/80 text-yellow-900 border border-yellow-300">
                Max {maxRetries} Attempts
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If a payment fails {maxRetries} times, automated retries stop immediately and the transaction is forwarded to human review.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-yellow-200/70 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
            <span>Status:</span>
            <span>Active &amp; Enforced</span>
          </div>
        </div>

        {/* Rule 2 */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'rgba(254, 249, 195, 0.45)', borderColor: 'rgba(234, 179, 8, 0.3)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Rule 2: Retry Cooldown</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                {cooldownHours}h Window
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Any retry attempt within {cooldownHours} hours on the same payment is safely skipped to avoid repetitive charging.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-yellow-200/70 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
            <span>Status:</span>
            <span>Active &amp; Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
