import React from 'react';
import { IndianRupee, RefreshCw, Zap, Trash2 } from 'lucide-react';

export default function Header({ onRefresh, onSeedData, onResetData, isRefreshing }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(255, 255, 255, 0.88)',
        borderBottom: '1px solid rgba(234, 179, 8, 0.28)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 2px 12px -2px rgba(161, 98, 7, 0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* ── Brand ── */}
          <div className="flex items-center gap-3.5">
            {/* Logo orb with Light Yellow / Gold Gradient */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
                boxShadow: '0 0 0 1px rgba(234, 179, 8, 0.4), 0 4px 16px rgba(217, 119, 6, 0.35)',
              }}
            >
              <IndianRupee className="w-5 h-5 text-white" strokeWidth={2.5} />
              {/* live indicator */}
              <span
                className="pulse-dot absolute -top-1 -right-1"
                style={{ width: 10, height: 10, border: '2px solid #ffffff' }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Razorpay{' '}
                  <span className="gradient-text">AI Revenue Recovery</span>
                </h1>
              </div>
              <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, fontWeight: 500 }}>
                Autonomous Failed Payment Recovery &amp; AI Protection Pipeline
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Refresh icon button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh dashboard data"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(254, 249, 195, 0.65)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                color: '#854d0e', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#713f12';
                e.currentTarget.style.borderColor = 'rgba(202,138,4,0.6)';
                e.currentTarget.style.background = 'rgba(254,240,138,0.95)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#854d0e';
                e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.35)';
                e.currentTarget.style.background = 'rgba(254, 249, 195, 0.65)';
              }}
            >
              <RefreshCw
                className={isRefreshing ? 'animate-spin' : ''}
                style={{ width: 15, height: 15, color: isRefreshing ? '#ca8a04' : 'inherit' }}
              />
            </button>

            <button onClick={onSeedData} className="btn-primary">
              <Zap style={{ width: 14, height: 14 }} />
              Load Demo Data
            </button>

            <button onClick={onResetData} className="btn-danger">
              <Trash2 style={{ width: 14, height: 14 }} />
              Reset
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
