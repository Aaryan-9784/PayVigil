import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, Mail, RotateCcw, ShieldCheck, Activity } from 'lucide-react';

function getActionBadge(summary) {
  const s = (summary || '').toLowerCase();
  if (s.includes('guardrail') || s.includes('skipped') || s.includes('cooldown')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <ShieldCheck className="w-3 h-3 text-purple-600" />
        Safety Cooldown
      </span>
    );
  }
  if (s.includes('retry_payment') || s.includes('retry')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <RotateCcw className="w-3 h-3 text-emerald-600" />
        Payment Retry
      </span>
    );
  }
  if (s.includes('send_reminder_email') || s.includes('email')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Mail className="w-3 h-3 text-blue-600" />
        Customer Email
      </span>
    );
  }
  if (s.includes('escalate_to_human') || s.includes('escalat')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        Support Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <Activity className="w-3 h-3" />
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
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Just now';
  }
}

export default function AuditTable({ logs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const summary = (log.summary || '').toLowerCase();
      const matchesSearch = summary.includes(searchTerm.toLowerCase()) || (log.id && log.id.includes(searchTerm));

      if (!matchesSearch) return false;
      if (filterType === 'ALL') return true;
      if (filterType === 'RETRY') return summary.includes('retry_payment') || summary.includes('retry');
      if (filterType === 'EMAIL') return summary.includes('send_reminder_email') || summary.includes('email');
      if (filterType === 'ESCALATE') return summary.includes('escalate_to_human') || summary.includes('escalat');
      return true;
    });
  }, [logs, searchTerm, filterType]);

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'RETRY', label: 'Retries' },
    { id: 'EMAIL', label: 'Emails' },
    { id: 'ESCALATE', label: 'Escalations' },
  ];

  return (
    <div className="theme-card overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Activity & Recovery Log</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {logs.length} events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time record of all payment recovery actions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
            <Clock className="w-6 h-6 text-slate-300 mb-0.5" />
            <p className="font-medium text-slate-600">No activity logs found</p>
            <p className="text-slate-400">Click "Load Demo Data" or test a scenario above.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {log.summary}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap text-slate-400 text-[11px]">
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

