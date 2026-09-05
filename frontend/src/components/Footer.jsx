import React from 'react';
import { Zap } from 'lucide-react';

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
          <span>Powered by <strong className="text-[#0c2340] font-bold">PayVigil Autonomous Recovery Engine</strong></span>
        </div>

        {/* Right — copyright/info */}
        <div className="text-xs text-slate-400 font-medium">
          Enterprise Payment Failure Triage &amp; Recovery
        </div>
      </div>
    </footer>
  );
}
