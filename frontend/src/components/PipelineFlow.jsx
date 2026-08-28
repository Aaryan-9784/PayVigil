import React from 'react';
import { ShieldCheck, Cpu, ArrowRight, BellRing, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PipelineFlow() {
  const steps = [
    {
      step: '01',
      title: 'Zero-Trust Ingestion',
      subtitle: 'HMAC-SHA256 & Idempotency',
      desc: 'Cryptographic payload verification & atomic locks prevent duplicate charges.',
      icon: Lock,
      badge: 'Security Gate',
      stepColor: 'bg-[#02042b] text-white',
      accentBorder: 'hover:border-[#0c83ff]',
      iconBg: 'bg-blue-50 text-[#0c83ff] border-blue-200',
    },
    {
      step: '02',
      title: 'AI Root Cause Triage',
      subtitle: 'Gemini ➔ Groq ➔ Heuristics',
      desc: 'Instant LLM classification of transient vs permanent failure reasons in ms.',
      icon: Cpu,
      badge: 'AI Diagnostic',
      stepColor: 'bg-[#0054b8] text-white',
      accentBorder: 'hover:border-[#0054b8]',
      iconBg: 'bg-blue-50 text-[#0054b8] border-blue-200',
    },
    {
      step: '03',
      title: 'Safety Guardrails',
      subtitle: 'Max Retries & 12h Cooldown',
      desc: 'Hard stopping rules stop bank throttling and customer payment spam.',
      icon: ShieldCheck,
      badge: 'Risk Control',
      stepColor: 'bg-[#10b981] text-white',
      accentBorder: 'hover:border-[#10b981]',
      iconBg: 'bg-emerald-50 text-[#10b981] border-emerald-200',
    },
    {
      step: '04',
      title: 'Omnichannel Action',
      subtitle: 'Retry • Email • WhatsApp • Slack',
      desc: 'Autonomous recovery dispatch with 1-click retry links in English & Hinglish.',
      icon: BellRing,
      badge: 'Recovery Dispatch',
      stepColor: 'bg-[#0c83ff] text-white',
      accentBorder: 'hover:border-[#0c83ff]',
      iconBg: 'bg-blue-50 text-[#0c83ff] border-blue-200',
    },
  ];

  return (
    <div className="glass-card p-6 fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-200 text-[#0c83ff]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0c2340] tracking-tight">
              Razorpay Autonomous Recovery Lifecycle
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5 font-medium">
              End-to-end payment degradation detection, AI diagnosis, and guardrail-protected resolution
            </p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0054b8] border border-blue-200 shadow-2xs">
            <span className="pulse-dot w-2 h-2" /> Live Gateway
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Guardrails Enforced
          </span>
        </div>
      </div>

      {/* 4-Step Pipeline Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className={`p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between transition-all duration-200 ${item.accentBorder} hover:shadow-md hover:-translate-y-0.5 group relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${item.stepColor} shadow-2xs`}>
                    Step {item.step}
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${item.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0c83ff] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] font-semibold text-[#0054b8] mt-0.5">
                  {item.subtitle}
                </p>
                <p className="text-[11px] text-[#64748b] mt-1.5 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span className="uppercase tracking-wider text-[#0054b8]">{item.badge}</span>
                {index < 3 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#0c83ff] hidden lg:block group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
