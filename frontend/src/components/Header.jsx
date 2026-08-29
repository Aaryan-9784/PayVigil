import React from 'react';
import { IndianRupee, RefreshCw, Trash2 } from 'lucide-react';

export default function Header({ onRefresh, onResetData, isRefreshing }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navbar */}
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* ── Official Razorpay Logo & Product Brand ── */}
          <div className="flex items-center gap-3.5">
            {/* Razorpay Logo Orb with Indian Rupee Symbol */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #02042b 0%, #0c2340 50%, #0c83ff 100%)',
                border: '1px solid rgba(12, 131, 255, 0.4)',
                boxShadow: '0 4px 14px rgba(12, 131, 255, 0.3)',
              }}
            >
              {/* Rupee Symbol Icon */}
              <IndianRupee className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-lg font-black tracking-tight text-[#0c2340] font-sans">
                  Razorpay
                </span>
                <span className="h-4 w-px bg-slate-300 hidden sm:block" />
                <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#0c83ff] border border-blue-200">
                  AI Revenue Recovery
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                Autonomous Payment Triage • Multi-Channel Retries &amp; Safety Guardrails
              </p>
            </div>
          </div>

          {/* ── Razorpay Action Bar ── */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Sync with Razorpay Gateway"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0c83ff] hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0c83ff]' : ''}`}
              />
            </button>

            {/* Protected Reset Database Button */}
            <button 
              onClick={onResetData} 
              title="Admin Authorized Action: Purge Database & Logs"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200 hover:border-red-300 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Clear Logs</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-200/70 text-red-800 font-bold ml-0.5">
                Admin
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
