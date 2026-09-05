import React, { useState, useRef, useEffect } from 'react';
import { 
  IndianRupee, 
  ChevronDown, 
  Trash2, 
  LogOut, 
  Lock, 
  Headphones, 
  Shield, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Wifi, 
  WifiOff, 
  Clock 
} from 'lucide-react';

export default function Header({ 
  onResetData, 
  onOpenLogin, 
  onLogout, 
  currentUser,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  refreshInterval = 10,
  onChangeRefreshInterval,
  onManualRefresh,
  isRefreshing = false,
  lastUpdated,
  wsConnected = false
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [intervalDropdownOpen, setIntervalDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (intervalRef.current && !intervalRef.current.contains(event.target)) {
        setIntervalDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on ESC key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setIntervalDropdownOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">

          {/* ── Official PayVigil Brand Logo ── */}
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="PayVigil AI Logo"
              className="w-8 h-8 rounded-xl shrink-0 shadow-sm"
              style={{
                boxShadow: '0 4px 12px rgba(12, 131, 255, 0.2)',
              }}
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black tracking-tight text-[#0c2340] font-sans">
                  PayVigil
                </span>
                <span className="h-3 w-px bg-slate-300 hidden sm:block" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#0c83ff] border border-blue-200/80">
                  AI Payment Recovery
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5 hidden md:block">
                Autonomous Payment Triage • Real-Time WebSockets &amp; Guardrails
              </p>
            </div>
          </div>

          {/* ── Right Profile Navigation ── */}
          <div className="flex items-center gap-3">
            {!currentUser ? (
              /* Public / Unauthenticated: Sign In Button */
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0c83ff]/50 hover:text-[#0c83ff] transition-all cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-[#0c83ff]" />
                <span>Sign In</span>
              </button>
            ) : (
              /* Authenticated User Pill (Admin or Customer Support) */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border transition-all cursor-pointer select-none ${
                    dropdownOpen 
                      ? 'bg-slate-100/90 border-slate-300 shadow-inner' 
                      : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Role Styled Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0"
                    style={{
                      background: isAdmin 
                        ? 'linear-gradient(135deg, #0c2340 0%, #0c83ff 100%)' 
                        : 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
                    }}
                  >
                    {isAdmin ? 'A' : <Headphones className="w-3.5 h-3.5" />}
                  </div>

                  {/* Username & Role Label */}
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 capitalize font-sans leading-none block">
                      {currentUser.username || (isAdmin ? 'Aryan Patel' : 'Support')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">
                      {isAdmin ? 'System Admin' : 'Support Team'}
                    </span>
                  </div>

                  {/* Dropdown Chevron */}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180 text-[#0c83ff]' : ''
                    }`}
                  />
                </button>

                {/* Floating User Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 overflow-hidden"
                    style={{
                      animation: 'fadeSlideUp 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 12px 30px -4px rgba(12, 35, 64, 0.12), 0 0 0 1px rgba(12, 35, 64, 0.05)'
                    }}
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{
                          background: isAdmin 
                            ? 'linear-gradient(135deg, #0c2340 0%, #0c83ff 100%)' 
                            : 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
                        }}
                      >
                        {isAdmin ? 'A' : <Headphones className="w-4 h-4" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 capitalize truncate">
                          {currentUser.username || (isAdmin ? 'Aryan Patel' : 'Customer Support')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium truncate">
                          {currentUser.email || (isAdmin ? 'aaryanpatel9784@gmail.com' : 'support@razorpay.com')}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="p-1.5 space-y-0.5">
                      {/* Only Admins have permissions to Clear Recovery Logs */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onResetData();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-xl transition-colors cursor-pointer text-left"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Clear Logs</span>
                        </button>
                      )}

                      {/* Sign Out for all users */}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

