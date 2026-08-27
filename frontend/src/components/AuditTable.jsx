import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, Mail, RotateCcw, ShieldCheck, Activity } from 'lucide-react';

function getActionBadge(summary) {
  const s = (summary || '').toLowerCase();

  if (s.includes('guardrail') || s.includes('skipped') || s.includes('cooldown')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(254, 240, 138, 0.8)', border: '1px solid rgba(202, 138, 4, 0.4)', color: '#854d0e' }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-yellow-700" />
        Safety Cooldown
      </span>
    );
  }
  if (s.includes('retry_payment') || s.includes('retry')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(209, 250, 229, 0.85)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#047857' }}
      >
        <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
        Payment Retry
      </span>
    );
  }
  if (s.includes('send_reminder_email') || s.includes('email')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(254, 249, 195, 0.9)', border: '1px solid rgba(234, 179, 8, 0.45)', color: '#a16207' }}
      >
        <Mail className="w-3.5 h-3.5 text-amber-700" />
        Customer Email
      </span>
    );
  }
  if (s.includes('escalate_to_human') || s.includes('escalat')) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{ background: 'rgba(254, 243, 199, 0.9)', border: '1px solid rgba(245, 158, 11, 0.45)', color: '#b45309' }}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
        Support Review
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: 'rgba(241, 245, 249, 0.9)', border: '1px solid rgba(203, 213, 225, 0.8)', color: '#475569' }}
    >
      <Activity className="w-3.5 h-3.5 text-slate-600" />
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
        style={{ borderBottom: '1px solid rgba(234,179,8,0.25)', background: 'rgba(254, 249, 195, 0.45)' }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Audit &amp; Recovery Log</h2>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-yellow-900 bg-yellow-100 border border-yellow-300"
            >
              {logs.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Immutable, real-time audit trail of all automated recovery decisions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex items-center flex-1 sm:w-64">
            <Search
              className="w-4 h-4 absolute left-3.5 pointer-events-none text-slate-400 z-10"
            />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 rounded-xl bg-white border border-yellow-300/80 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none shadow-sm transition-all"
              style={{ paddingLeft: '40px', paddingRight: '14px', paddingTop: '8px', paddingBottom: '8px' }}
            />
          </div>

          {/* Filter Tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(234,179,8,0.3)' }}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                style={
                  filterType === tab.id
                    ? { background: 'linear-gradient(135deg, #f59e0b, #eab308)', color: '#ffffff', boxShadow: '0 2px 8px rgba(217,119,6,0.3)' }
                    : { color: '#64748b' }
                }
                onMouseEnter={e => { if (filterType !== tab.id) e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={e => { if (filterType !== tab.id) e.currentTarget.style.color = '#64748b'; }}
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
              style={{ background: 'rgba(254, 240, 138, 0.5)', border: '1px solid rgba(234, 179, 8, 0.35)' }}
            >
              <Clock className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No activity logs matching criteria</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Click "Load Demo Data" or execute a simulator action above</p>
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
            <tbody className="divide-y divide-amber-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-yellow-50/60 transition-colors">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-800 font-medium leading-relaxed">
                    {log.summary}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap text-xs font-semibold text-slate-500">
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
