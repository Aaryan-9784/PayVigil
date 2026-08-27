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
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#64748b',
};
/* ─── Shared big-value style ─────────────────────── */
const bigVal = {
  fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
  color: '#f1f5f9', lineHeight: 1.1,
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
        style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.1) 0%,rgba(13,18,35,0.75) 55%)', borderColor: 'rgba(52,211,153,0.25)' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={labelStyle}>Recovered Revenue</span>
          <div className="icon-box icon-box-emerald"><TrendingUp style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ ...bigVal, background:'linear-gradient(135deg,#6ee7b7,#34d399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {loading ? <span className="shimmer" /> : formatINR(totalRecovered)}
        </div>
        {!loading && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6ee7b7', fontWeight:600 }}>
            <CheckCircle2 style={{ width:13, height:13 }} />
            {successfulActions} payments recovered
          </div>
        )}
      </div>

      {/* ── 2. Failed Payments ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-1"
        style={{ background:'linear-gradient(135deg,rgba(251,191,36,0.09) 0%,rgba(13,18,35,0.75) 55%)', borderColor:'rgba(251,191,36,0.22)' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={labelStyle}>Failed Payments</span>
          <div className="icon-box icon-box-amber"><AlertTriangle style={{ width:16, height:16 }} /></div>
        </div>
        <div style={bigVal}>
          {loading ? <span className="shimmer" /> : formatINR(totalAtRisk)}
        </div>
        {!loading && (
          <div style={{ marginTop:10, fontSize:12, color:'#94a3b8', fontWeight:500 }}>
            Total failed volume detected
          </div>
        )}
      </div>

      {/* ── 3. Recovery Rate ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-2"
        style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(13,18,35,0.75) 55%)', borderColor:'rgba(129,140,248,0.25)' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={labelStyle}>Recovery Rate</span>
          <div className="icon-box icon-box-blue"><Activity style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:14 }}>
          <span style={{ ...bigVal, background:'linear-gradient(135deg,#a5b4fc,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            {loading ? '…' : `${recoveryRate}%`}
          </span>
          {!loading && (
            <span style={{ fontSize:11.5, color:'#64748b', fontWeight:500 }}>
              ({successfulActions}/{totalActions})
            </span>
          )}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: loading ? '0%' : `${Math.min(recoveryRate,100)}%` }} />
        </div>
      </div>

      {/* ── 4. Safety Limits ── */}
      <div
        className="glass-card-interactive p-5 fade-in-delay-3"
        style={{ background:'linear-gradient(135deg,rgba(167,139,250,0.1) 0%,rgba(13,18,35,0.75) 55%)', borderColor:'rgba(167,139,250,0.25)' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={labelStyle}>Safety Limits</span>
          <div className="icon-box icon-box-purple"><ShieldCheck style={{ width:16, height:16 }} /></div>
        </div>
        <div style={{ ...bigVal, background:'linear-gradient(135deg,#c4b5fd,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {loading ? <span className="shimmer" /> : `${skippedCount} Prevented`}
        </div>
        {!loading && (
          <div style={{ marginTop:10, fontSize:12, color:'#c4b5fd', fontWeight:600 }}>
            Protected from duplicate retries
          </div>
        )}
      </div>

    </div>
  );
}
