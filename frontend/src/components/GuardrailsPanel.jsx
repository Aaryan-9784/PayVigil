import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function GuardrailsPanel({ guardrails }) {
  const maxRetries = guardrails?.max_retry_attempts ?? 3;
  const cooldownHours = guardrails?.retry_cooldown_hours ?? 12;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="icon-box icon-box-blue">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0c2340]">Safety Rules &amp; Protection</h2>
            <p className="text-xs text-[#64748b]">Automated limits to protect customer experience</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Rule 1 */}
        <div
          className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#0c2340]">Rule 1: Maximum Retries</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0054b8] border border-blue-200">
                Max {maxRetries} Attempts
              </span>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">
              If a payment fails {maxRetries} times, automated retries stop immediately and the transaction is forwarded to human review.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-[11px] text-[#0054b8] font-semibold">
            <span>Status:</span>
            <span>Active &amp; Enforced</span>
          </div>
        </div>

        {/* Rule 2 */}
        <div
          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#0c2340]">Rule 2: Retry Cooldown</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                {cooldownHours}h Window
              </span>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">
              Any retry attempt within {cooldownHours} hours on the same payment is safely skipped to avoid repetitive charging.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
            <span>Status:</span>
            <span>Active &amp; Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
