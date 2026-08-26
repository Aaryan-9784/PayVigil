import React from 'react';
import { Bot, RefreshCw, Zap, Trash2, ShieldCheck, Activity, Cpu, CheckCircle2 } from 'lucide-react';

export default function Header({
  isAutoRefresh,
  setIsAutoRefresh,
  onRefresh,
  onSeedData,
  onResetData,
  isRefreshing
}) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Brand Identity & Engine Details */}
          <div className="flex items-center gap-3.5">
            {/* Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 p-0.5 shadow-sm shadow-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Title & Status Details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  Razorpay <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">AI Revenue Recovery</span>
                </h1>
              </div>

              <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Cpu className="w-3 h-3 text-indigo-600 inline" /> Claude Sonnet 3.5
                </span>
                <span>•</span>
                <span className="text-slate-600">Webhook Gateway</span>
                <span>•</span>
                <span className="text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                  <ShieldCheck className="w-3 h-3" /> Stopping Rules Active
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2.5 self-start lg:self-center">
            {/* Live Polling & Refresh Segmented Pill */}
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200 shadow-xs h-8">
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                title="Toggle automatic 10-second polling"
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  isAutoRefresh
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                <span>{isAutoRefresh ? 'Live Poll (10s)' : 'Polling Paused'}</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-all disabled:opacity-50"
                title="Refresh dashboard data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* Seed Demo Scenarios */}
            <button
              onClick={onSeedData}
              title="Populate test failure scenarios across all 3 recovery branches"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600/20" />
              <span>Seed Scenarios</span>
            </button>

            {/* Reset Database */}
            <button
              onClick={onResetData}
              title="Clear all events and reset audit logs"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
              <span>Reset</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
