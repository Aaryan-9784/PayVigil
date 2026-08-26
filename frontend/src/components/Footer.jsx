import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs mt-12 py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Guardrails Active
        </span>
        <span>System Healthy</span>
      </div>
    </footer>
  );
}


