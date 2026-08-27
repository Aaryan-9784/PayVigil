import React from 'react';
import { ShieldCheck, Activity, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-16 py-6"
      style={{
        borderTop: '1px solid rgba(234, 179, 8, 0.25)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -2px 12px -2px rgba(161, 98, 7, 0.04)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left — branding */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Powered by <strong className="text-amber-800 font-bold">Razorpay Autonomous Engine</strong></span>
        </div>

        {/* Right — status pills */}
        <div className="flex items-center gap-3 text-xs">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold"
            style={{ background: 'rgba(209, 250, 229, 0.85)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#047857' }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Safety Guardrails Active
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold"
            style={{ background: 'rgba(254, 249, 195, 0.9)', border: '1px solid rgba(234, 179, 8, 0.45)', color: '#854d0e' }}
          >
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            System Healthy
          </span>
        </div>
      </div>
    </footer>
  );
}
