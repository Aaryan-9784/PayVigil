import React from 'react';
import { ShieldCheck, Activity, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-16 py-6"
      style={{
        borderTop: '1px solid rgba(12, 131, 255, 0.15)',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -2px 14px -2px rgba(12, 35, 64, 0.04)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left — branding */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Zap className="w-4 h-4 text-[#0c83ff]" />
          <span>Powered by <strong className="text-[#0c2340] font-bold">Razorpay Autonomous Recovery Engine</strong></span>
        </div>

        {/* Right — status pills */}
        <div className="flex items-center gap-3 text-xs">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Safety Guardrails Active
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-blue-50 text-[#0054b8] border border-blue-200"
          >
            <Activity className="w-3.5 h-3.5 text-[#0c83ff]" />
            System Healthy
          </span>
        </div>
      </div>
    </footer>
  );
}
