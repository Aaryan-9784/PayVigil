import React from 'react';
import { IndianRupee, RefreshCw, Zap, Trash2 } from 'lucide-react';

export default function Header({ onRefresh, onSeedData, onResetData, isRefreshing }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(6, 11, 24, 0.8)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* ── Brand ── */}
          <div className="flex items-center gap-4">
            {/* Logo orb */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                boxShadow: '0 0 0 1px rgba(139,92,246,0.4), 0 0 24px rgba(99,102,241,0.55)',
              }}
            >
              <IndianRupee className="w-5 h-5" style={{ color: '#fff' }} strokeWidth={2.5} />
              {/* live indicator */}
              <span
                className="pulse-dot absolute -top-1 -right-1"
                style={{ width: 10, height: 10, border: '2px solid #060b18' }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0 }}>
                  Razorpay{' '}
                  <span className="gradient-text">AI Revenue Recovery</span>
                </h1>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 9999,
                    fontSize: 11, fontWeight: 700,
                    background: 'rgba(74,222,128,0.12)',
                    border: '1px solid rgba(74,222,128,0.3)',
                    color: '#86efac',
                  }}
                >
                  <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                  Live
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 3, fontWeight: 500 }}>
                Autonomous Failed Payment Recovery &amp; AI Protection System
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Refresh icon button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh dashboard"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#64748b', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#c4b5fd';
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)';
                e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <RefreshCw
                className={isRefreshing ? 'animate-spin' : ''}
                style={{ width: 15, height: 15, color: isRefreshing ? '#a78bfa' : 'inherit' }}
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
