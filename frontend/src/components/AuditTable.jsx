import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertOctagon, Mail, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';

function getActionBadge(summary) {
  const s = (summary || '').toLowerCase();
  if (s.includes('guardrail') || s.includes('skipped')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
        Guardrail Intercept
      </span>
    );
  }
  if (s.includes('retry_payment')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
        Retry Payment
      </span>
    );
  }
  if (s.includes('send_reminder_email')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Mail className="w-3.5 h-3.5 text-blue-600" />
        Reminder Email
      </span>
    );
  }
  if (s.includes('escalate_to_human')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
        Human Escalation
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
      <Sparkles className="w-3.5 h-3.5" />
      Audit Record
    </span>
  );
}

function formatRelativeTime(dateStr) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export default function AuditTable({ logs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const summary = (log.summary || '').toLowerCase();
      const matchesSearch = summary.includes(searchTerm.toLowerCase()) || log.id.includes(searchTerm);

      if (!matchesSearch) return false;
      if (filterType === 'ALL') return true;
      if (filterType === 'RETRY') return summary.includes('retry_payment');
      if (filterType === 'EMAIL') return summary.includes('send_reminder_email');
      if (filterType === 'ESCALATE') return summary.includes('escalate_to_human');
      if (filterType === 'GUARDRAIL') return summary.includes('guardrail') || summary.includes('skipped');
      return true;
    });
  }, [logs, searchTerm, filterType]);

  return (
    <div className="theme-card border-slate-200 shadow-card overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">Immutable Audit Trail</h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {logs.length} logged
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Verified log of every Razorpay failure diagnosis and execution outcome
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs text-xs">
            {['ALL', 'RETRY', 'EMAIL', 'ESCALATE', 'GUARDRAIL'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[440px]">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-slate-300 mb-1" />
            <p className="font-bold text-slate-600">No matching audit logs found.</p>
            <p className="font-medium">Use the 1-Click test buttons above to trigger recovery events.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] z-10">
              <tr>
                <th className="py-3 px-5">Action Type</th>
                <th className="py-3 px-5">Audit Summary & Outcome</th>
                <th className="py-3 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3.5 px-5 text-slate-800 font-bold">
                    <span>{log.summary}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap text-slate-500 font-mono text-[11px] font-semibold">
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
