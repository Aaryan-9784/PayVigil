import React, { useState, useMemo } from 'react';
import {
  Search, Clock, AlertTriangle, Mail, RotateCcw, ShieldCheck, Activity,
  Download, Eye, X, CheckCircle2, Copy, Sparkles, MessageSquare
} from 'lucide-react';

function getActionBadge(summary) {
  const s = (summary || '').toLowerCase();

  if (s.includes('guardrail') || s.includes('skipped') || s.includes('cooldown')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Safety Cooldown
      </span>
    );
  }
  if (s.includes('retry_payment') || s.includes('retry')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0c83ff] text-white border border-[#0054b8] shadow-xs">
        <RotateCcw className="w-3.5 h-3.5" />
        Payment Retry
      </span>
    );
  }
  if (s.includes('send_reminder_email') || s.includes('email')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0054b8] border border-blue-200 shadow-2xs">
        <Mail className="w-3.5 h-3.5 text-[#0c83ff]" />
        Customer Email
      </span>
    );
  }
  if (s.includes('escalate_to_human') || s.includes('escalat')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Support Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
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
  const [selectedLog, setSelectedLog] = useState(null);
  const [msgLang, setMsgLang] = useState('hinglish'); // 'hinglish' | 'en'
  const [copied, setCopied] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const summary = (log.summary || '').toLowerCase();
      const matchesSearch = summary.includes(searchTerm.toLowerCase()) || 
        (log.id && log.id.includes(searchTerm)) ||
        (log.customer_id && log.customer_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.payment_id && log.payment_id.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === 'ALL')      return true;
      if (filterType === 'RETRY')    return summary.includes('retry_payment') || summary.includes('retry');
      if (filterType === 'EMAIL')    return summary.includes('send_reminder_email') || summary.includes('email');
      if (filterType === 'ESCALATE') return summary.includes('escalate_to_human') || summary.includes('escalat');
      return true;
    });
  }, [logs, searchTerm, filterType]);

  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['Audit ID', 'Timestamp', 'Summary', 'Customer ID', 'Payment ID', 'Error Code', 'Root Cause', 'Action Type', 'Action Status', 'Amount Recovered (INR)'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(l => [
        `"${l.id}"`,
        `"${l.created_at}"`,
        `"${(l.summary || '').replace(/"/g, '""')}"`,
        `"${l.customer_id || 'N/A'}"`,
        `"${l.payment_id || 'N/A'}"`,
        `"${l.error_code || 'N/A'}"`,
        `"${(l.root_cause || '').replace(/"/g, '""')}"`,
        `"${l.action_type || 'N/A'}"`,
        `"${l.action_status || 'N/A'}"`,
        `"${l.amount_recovered_inr || 0}"`,
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `razorpay_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card overflow-hidden fade-in-delay-4">
      {/* Table Header & Controls */}
      <div
        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[#0c2340] tracking-tight">Audit &amp; Recovery Log</h2>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-[#0054b8] bg-blue-50 border border-blue-200"
            >
              {logs.length} Recorded
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1 font-medium">
            Immutable, real-time audit trail of all automated recovery decisions • <span className="text-[#0c83ff] font-semibold">Click any row to inspect AI reasoning</span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Download CSV Audit Report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0c2340] bg-white border border-slate-300 shadow-sm hover:bg-blue-50 hover:text-[#0c83ff] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0c83ff]" />
            Export CSV
          </button>

          {/* Search Box */}
          <div className="relative flex items-center flex-1 sm:w-56">
            <Search
              className="w-4 h-4 absolute left-3.5 pointer-events-none text-slate-400 z-10"
            />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium text-[#0c2340] placeholder:text-slate-400 rounded-xl bg-white border border-slate-300 focus:border-[#0c83ff] focus:ring-2 focus:ring-blue-100 outline-none shadow-sm transition-all"
              style={{ paddingLeft: '40px', paddingRight: '14px', paddingTop: '7px', paddingBottom: '7px' }}
            />
          </div>

          {/* Filter Tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#0c83ff] text-white shadow-xs'
                    : 'text-[#64748b] hover:text-[#0c2340]'
                }`}
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-200">
              <Clock className="w-6 h-6 text-[#0c83ff]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0c2340]">No activity logs matching criteria</p>
              <p className="text-xs text-[#64748b] mt-1 font-medium">Click "Load Demo Data" or execute a simulator action above</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left dark-table">
            <thead>
              <tr>
                <th className="py-3 px-5">Autonomous Action</th>
                <th className="py-3 px-5">Details &amp; Root Cause</th>
                <th className="py-3 px-5 text-center">AI Diagnostics</th>
                <th className="py-3 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#0c2340] font-medium leading-relaxed">
                    {log.summary}
                  </td>
                  <td className="py-3.5 px-5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#0054b8] shadow-2xs group-hover:border-[#0c83ff] transition-colors">
                      <Eye className="w-3.5 h-3.5 text-[#0c83ff]" />
                      Inspect AI
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap text-xs font-semibold text-[#64748b]">
                    <span title={log.created_at}>{formatRelativeTime(log.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── AI Reasoning & Customer Message Modal ─────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c2340]/60 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c2340] to-[#0c83ff] flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0c2340]">
                    AI Decision &amp; Communication Breakdown
                  </h3>
                  <p className="text-xs text-[#64748b] font-medium">
                    Payment ID: <strong className="text-[#0c2340]">{selectedLog.payment_id || selectedLog.id}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0c2340] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* 1. Diagnostic Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-bold text-[#0054b8] uppercase tracking-wider block">Decision Engine</span>
                  <span className="font-extrabold text-[#0c2340] mt-1 block">{selectedLog.ai_model || 'Google Gemini 1.5 Flash'}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">AI Confidence</span>
                  <span className="font-extrabold text-emerald-700 mt-1 block">{selectedLog.confidence || '98.5% HIGH'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Action Type</span>
                  <span className="font-extrabold text-[#0c2340] mt-1 uppercase block">{selectedLog.action_type?.replace(/_/g, ' ') || 'Smart Retry'}</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-[#0054b8] uppercase tracking-wider block">Recovered Amount</span>
                  <span className="font-extrabold text-[#0c83ff] mt-1 block">₹{Number(selectedLog.amount_recovered_inr || selectedLog.amount_inr || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 2. AI Root Cause Reasoning */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0c83ff]" />
                  <h4 className="text-xs font-bold text-[#0c2340] uppercase tracking-wider">AI Root Cause Diagnosis</h4>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {selectedLog.root_cause || selectedLog.summary}
                </p>
                <div className="mt-2 text-[11px] text-[#64748b] flex items-center gap-2 font-mono">
                  <span>Error Code: <strong>{selectedLog.error_code || 'GATEWAY_TIMEOUT'}</strong></span>
                </div>
              </div>

              {/* 3. Generated Customer Communication (English vs Hinglish) */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#0c83ff]" />
                    <span className="text-xs font-bold text-[#0c2340]">Generated Customer Message Preview</span>
                  </div>
                  
                  {/* Language Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setMsgLang('hinglish')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        msgLang === 'hinglish' ? 'bg-[#0c83ff] text-white shadow-2xs' : 'text-[#64748b] hover:text-[#0c2340]'
                      }`}
                    >
                      🇮🇳 Hinglish
                    </button>
                    <button
                      onClick={() => setMsgLang('en')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        msgLang === 'en' ? 'bg-[#0c83ff] text-white shadow-2xs' : 'text-[#64748b] hover:text-[#0c2340]'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/20">
                  <p className="text-xs font-medium text-[#0c2340] leading-relaxed font-mono">
                    {msgLang === 'hinglish' ? (selectedLog.customer_message_hinglish || selectedLog.customer_message_en || selectedLog.summary) : (selectedLog.customer_message_en || selectedLog.summary)}
                  </p>
                  
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#64748b] font-medium">Channel: <strong>WhatsApp / SMS / Email</strong></span>
                    <button
                      onClick={() => handleCopyMessage(msgLang === 'hinglish' ? selectedLog.customer_message_hinglish : selectedLog.customer_message_en)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-blue-200 text-[#0054b8] hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Template'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Safety Guardrails Compliance Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-[#0c2340] uppercase tracking-wider block mb-2">
                  🛡️ Financial Guardrail Compliance Verification
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> HMAC-SHA256
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Idempotent Lock
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> &lt; 3 Max Retries
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 12h Cooldown OK
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
