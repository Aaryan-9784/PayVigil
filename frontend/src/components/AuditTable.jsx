import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, Mail, RotateCcw, ShieldCheck, Activity } from 'lucide-react';

function getActionBadge(summary) {
  const s = (summary || '').toLowerCase();

  if (s.includes('guardrail') || s.includes('skipped') || s.includes('cooldown')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.4)', color: '#d8b4fe' }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
        Safety Cooldown
      </span>
    );
  }
  if (s.includes('retry_payment') || s.includes('retry')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.4)', color: '#6ee7b7' }}
      >
        <RotateCcw className="w-3.5 h-3.5 text-emerald-300" />
        Payment Retry
      </span>
    );
  }
  if (s.includes('send_reminder_email') || s.includes('email')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.4)', color: '#a5b4fc' }}
      >
        <Mail className="w-3.5 h-3.5 text-indigo-300" />
        Customer Email
      </span>
    );
  }
  if (s.includes('escalate_to_human') || s.includes('escalat')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.4)', color: '#fde68a' }}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
        Support Review
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.3)', color: '#cbd5e1' }}
    >
      <Activity className="w-3.5 h-3.5 text-slate-300" />
      Activity Log
    </span>
  );
}

function formatRelativeTime(dateStr) {
  try {
    if (!dateStr) return 'Just now';
    let normalized = dateStr;
    if (typeof normalized === 'string' && !normalized.endsWith('Z') && !normalized.includes('+')) {
      normalized = normalized + 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 10 || isNaN(diffSec) || diffSec < 0) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Just now';
  }
}

const FILTER_TABS = [
  { id: 'ALL',      label: 'All Events' },
  { id: 'RETRY',    label: 'Auto Retries' },
  { id: 'EMAIL',    label: 'Emails Sent' },
  { id: 'ESCALATE', label: 'Escalations' },
];

export default function AuditTable({ logs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const summary = (log.summary || '').toLowerCase();
      const matchesSearch = summary.includes(searchTerm.toLowerCase()) || (log.id && log.id.includes(searchTerm));
      if (!matchesSearch) return false;
      if (filterType === 'ALL')      return true;
      if (filterType === 'RETRY')    return summary.includes('retry_payment') || summary.includes('retry');
      if (filterType === 'EMAIL')    return summary.includes('send_reminder_email') || summary.includes('email');
      if (filterType === 'ESCALATE') return summary.includes('escalate_to_human') || summary.includes('escalat');
      return true;
    });
  }, [logs, searchTerm, filterType]);

  return (
    <div className="glass-card overflow-hidden fade-in-delay-4">
      {/* Table Header & Controls */}
      <div
        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(13,18,35,0.85)' }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">Audit &amp; Recovery Log</h2>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-indigo-300 bg-indigo-500/20 border border-indigo-500/30"
            >
              {logs.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Immutable, real-time audit trail of all automated recovery decisions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dark-input pl-10 pr-4 py-2 text-xs font-medium text-slate-200 placeholder:text-slate-500 rounded-xl"
            />
          </div>

          {/* Filter Tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                style={
                  filterType === tab.id
                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#ffffff', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }
                    : { color: '#94a3b8' }
                }
                onMouseEnter={e => { if (filterType !== tab.id) e.currentTarget.style.color = '#f1f5f9'; }}
                onMouseLeave={e => { if (filterType !== tab.id) e.currentTarget.style.color = '#94a3b8'; }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
        {filteredLogs.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">No activity logs matching criteria</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Click "Load Demo Data" or execute a simulator action above</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left dark-table">
            <thead>
              <tr>
                <th className="py-3 px-5">Autonomous Action</th>
                <th className="py-3 px-5">Details &amp; Reason</th>
                <th className="py-3 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-200 font-medium leading-relaxed">
                    {log.summary}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap text-xs font-semibold text-slate-400">
                    <span title={log.created_at}>{formatRelativeTime(log.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
