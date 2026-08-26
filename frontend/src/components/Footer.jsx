import React from 'react';
import { Bot, ShieldCheck, Lock, Activity, CheckCircle2, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/95 text-slate-600 text-xs font-medium mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Top Footer Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-xs">
                Razorpay AI Revenue Recovery Engine
              </p>
              <p className="text-[11px] text-slate-500">
                Autonomous payment degradation recovery, root-cause diagnosis, and bounded execution
              </p>
            </div>
          </div>

          {/* Pipeline Badge Pills */}
          <div className="flex items-center flex-wrap gap-1.5 text-[10px] font-bold font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              HMAC-SHA256 Ingest
            </span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Claude Sonnet Agent
            </span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              3-Branch Execution
            </span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Stopping Rules
            </span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Audit Trail
            </span>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Production Hackathon Edition v1.0.0</span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            <span>Built for Razorpay AI Agent Track</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
