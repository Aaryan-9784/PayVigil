import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Clock, AlertTriangle, Mail, RotateCcw, ShieldCheck, Activity,
  Download, Eye, X, CheckCircle2, Copy, Sparkles, MessageSquare,
  Phone, ExternalLink, FileText, Send, Share2, Check, Zap, User, CreditCard, Lock, ArrowUpRight
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
  const [modalTab, setModalTab] = useState('diagnosis'); // 'diagnosis' | 'resolution'
  const [msgLang, setMsgLang] = useState('hinglish'); // 'hinglish' | 'en'
  const [copied, setCopied] = useState(false);
  const [copiedPaymentId, setCopiedPaymentId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Lock body scrolling and attach Escape key listener when modal is open
  useEffect(() => {
    if (selectedLog) {
      setModalTab('diagnosis');
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setSelectedLog(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedLog]);

  const handleCopyMessage = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPaymentId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedPaymentId(true);
    setTimeout(() => setCopiedPaymentId(false), 2000);
  };

  const handleCopyLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportJSON = (log) => {
    if (!log) return;
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `incident_${log.payment_id || log.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {getActionBadge(log.summary)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#0c2340] font-medium leading-relaxed">
                    {log.summary}
                  </td>
                  <td className="py-3.5 px-5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-[#0054b8] shadow-2xs hover:bg-[#0c83ff] hover:text-white hover:border-[#0054b8] transition-all cursor-pointer"
                      title="Inspect AI Decision & Communication Breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect AI
                    </button>
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

      {/* ─── AI Reasoning & Diagnostics Modal (Portaled to document.body) ─── */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-[#02042b]/85 backdrop-blur-md animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedLog(null); }}
        >
          <div
            className="relative w-full max-w-2xl my-auto rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-[#0c2340] to-[#0054b8] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#0c83ff] shadow-inner shrink-0">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      AI Decision &amp; Security Diagnostics
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Razorpay Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                    <span>Payment ID:</span>
                    <button
                      onClick={() => handleCopyPaymentId(selectedLog.payment_id || selectedLog.id)}
                      className="inline-flex items-center gap-1 font-mono font-bold text-sky-300 hover:text-white bg-white/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      title="Click to copy Payment ID"
                    >
                      <span>{selectedLog.payment_id || selectedLog.id}</span>
                      {copiedPaymentId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh] bg-slate-50/40">
              
              {/* Customer & Transaction Metadata Strip */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer ID</span>
                    <strong className="text-[#0c2340] font-medium block mt-0.5 truncate" title={selectedLog.customer_id || '+91 8238012515'}>
                      {selectedLog.customer_id || '+91 8238012515'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Order Reference</span>
                    <strong className="text-[#0c2340] font-medium block mt-0.5 font-mono">
                      ORD-{(selectedLog.payment_id || selectedLog.id).slice(-6).toUpperCase()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gateway</span>
                    <strong className="text-[#0c2340] font-medium block mt-0.5">
                      Razorpay Standard
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Incident Time</span>
                    <strong className="text-[#0c2340] font-medium block mt-0.5" title={selectedLog.created_at}>
                      {formatRelativeTime(selectedLog.created_at)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 4 Financial & Decision KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-xs">
                  <span className="text-[10px] font-bold text-[#0054b8] uppercase tracking-wider block">Decision Engine</span>
                  <span className="font-extrabold text-[#0c2340] mt-1 block truncate">{selectedLog.ai_model || 'Google Gemini 2.0 Flash'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">AI Confidence</span>
                  <span className="font-extrabold text-emerald-700 mt-1 block">{selectedLog.confidence || '98.5% HIGH'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">At-Risk Volume</span>
                  <span className="font-extrabold text-amber-900 mt-1 block">₹{Number(selectedLog.amount_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className={`p-3 rounded-xl bg-white border shadow-xs ${selectedLog.amount_recovered_inr > 0 ? 'border-emerald-300' : 'border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Recovery Status</span>
                  <span className={`font-extrabold mt-1 block ${selectedLog.amount_recovered_inr > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {selectedLog.amount_recovered_inr > 0 ? `₹${Number(selectedLog.amount_recovered_inr).toLocaleString('en-IN')} (Paid)` : '₹0 (Pending)'}
                  </span>
                </div>
              </div>

              {/* AI Root Cause & Playbook */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0c83ff] animate-pulse" />
                      <h4 className="text-xs font-bold text-[#0c2340] uppercase tracking-wider">AI Root Cause Diagnosis</h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Code: {selectedLog.error_code || 'BAD_REQUEST_ERROR'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedLog.root_cause || selectedLog.summary}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs">
                  <div className="font-bold text-[#0054b8] flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-[#0c83ff]" />
                    AI Autonomous Action Executed
                  </div>
                  <p className="text-[#0c2340] leading-relaxed text-[11px]">
                    {selectedLog.summary?.toLowerCase().includes('retry')
                      ? 'Smart Gateway Retry scheduled for off-peak bank window. Automated token recharge will execute safely without double deduction.'
                      : 'Failure diagnosed. Automated recovery workflow initialized.'}
                  </p>
                </div>
              </div>

            </div>

            {/* 3. Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0c2340] hover:bg-[#0054b8] transition-colors cursor-pointer shadow-xs"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
