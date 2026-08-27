import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

export function formatINR(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(rupees);
}

/* ─── Shared label style ─────────────────────────── */
const labelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#64748b',
};
/* ─── Shared big-value style ─────────────────────── */
const bigVal = {
  fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
  color: '#0f172a', lineHeight: 1.1,
};

export default function SummaryCards({ data, loading }) {
  const totalRecovered   = data?.total_recovered_paise || 0;
  const totalAtRisk      = data?.total_at_risk_paise   || 0;
  const recoveryRate     = data?.recovery_rate_pct     || 0;
  const totalActions     = data?.total_actions         || 0;
  const successfulActions= data?.successful_actions    || 0;
  const skippedCount     = data?.breakdown?.skipped_stopping_rule || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* ── 1. Recovered Revenue ── */}
      <div
        className="glass-card-interactive p-5 fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.5) 0%, rgba(255, 255, 255, 0.95) 60%)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={labelStyle}>Recovered Revenue</span>
          <div className="icon-box icon-box-emerald"><TrendingUp style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ ...bigVal, color: '#047857' }}>
          {loading ? <span className="shimmer" /> : formatINR(totalRecovered)}
        </div>
        {!loading && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#059669', fontWeight:600 }}>
            <CheckCircle2 style={{ width:13, height:13 }} />
            {successfulActions} payments recovered
          </div>
        )}
      </div>

      {/* ── 2. Failed Payments Volume ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-1"
        style={{
          background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.45) 0%, rgba(255, 255, 255, 0.95) 60%)',
          borderColor: 'rgba(234, 179, 8, 0.35)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={labelStyle}>At-Risk Volume</span>
          <div className="icon-box icon-box-amber"><AlertTriangle style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ ...bigVal, color: '#b45309' }}>
          {loading ? <span className="shimmer" /> : formatINR(totalAtRisk)}
        </div>
        {!loading && (
          <div style={{ marginTop:10, fontSize:12, color:'#64748b', fontWeight:500 }}>
            Total failed volume detected
          </div>
        )}
      </div>

      {/* ── 3. Recovery Success Rate ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-2"
        style={{
          background: 'linear-gradient(135deg, rgba(254, 249, 195, 0.6) 0%, rgba(255, 255, 255, 0.95) 60%)',
          borderColor: 'rgba(202, 138, 4, 0.35)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={labelStyle}>Recovery Rate</span>
          <div className="icon-box icon-box-yellow"><Activity style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:12 }}>
          <span style={{ ...bigVal, color: '#854d0e' }}>
            {loading ? '…' : `${recoveryRate}%`}
          </span>
          {!loading && (
            <span style={{ fontSize:11.5, color:'#64748b', fontWeight:600 }}>
              ({successfulActions}/{totalActions})
            </span>
          )}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: loading ? '0%' : `${Math.min(recoveryRate,100)}%` }} />
        </div>
      </div>

      {/* ── 4. Safety Guardrails Prevented ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-3"
        style={{
          background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, rgba(255, 255, 255, 0.95) 60%)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={labelStyle}>Safety Guardrails</span>
          <div className="icon-box icon-box-yellow"><ShieldCheck style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ ...bigVal, color: '#713f12' }}>
          {loading ? <span className="shimmer" /> : `${skippedCount} Prevented`}
        </div>
        {!loading && (
          <div style={{ marginTop:10, fontSize:12, color:'#a16207', fontWeight:600 }}>
            Protected from spam retries
          </div>
        )}
      </div>

    </div>
  );
}
