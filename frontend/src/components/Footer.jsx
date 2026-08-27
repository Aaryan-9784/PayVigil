import React from 'react';
import { ShieldCheck, Activity, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-16 py-6"
      style={{
        borderTop: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(6, 11, 24, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left — branding */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Powered by <strong className="text-indigo-300 font-bold">Razorpay Autonomous Engine</strong></span>
        </div>

        {/* Right — status pills */}
        <div className="flex items-center gap-3 text-xs">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#6ee7b7' }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Safety Guardrails Active
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            System Healthy
          </span>
        </div>
      </div>
    </footer>
  );
}
