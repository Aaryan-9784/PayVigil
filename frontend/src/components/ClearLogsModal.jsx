import React, { useState } from 'react';
import { ShieldAlert, Lock, X, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';

export default function ClearLogsModal({ isOpen, onClose, onConfirm, isClearing }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationText.trim().toUpperCase() === 'CONFIRM';

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!isConfirmed) {
      setErrorMsg('Please type CONFIRM to authorize log purge.');
      return;
    }
    setErrorMsg('');
    await onConfirm(adminKey.trim() || null);
  };

  const handleClose = () => {
    setConfirmationText('');
    setAdminKey('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isClearing ? handleClose : undefined}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        style={{ animation: 'fadeSlideUp 0.25s ease-out' }}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">Admin Security Verification</h3>
              </div>
              <p className="text-xs text-red-100 font-medium">Protected Database Reset Action</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isClearing}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleExecute} className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 leading-relaxed font-medium">
              This action will permanently delete all <strong>recovery events</strong>, <strong>AI diagnosis logs</strong>, and <strong>audit trails</strong> from PostgreSQL. This cannot be undone.
            </p>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Type <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 font-bold">CONFIRM</span> to authorize:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="CONFIRM"
              disabled={isClearing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50/50"
              autoFocus
            />
          </div>

          {/* Optional Admin Passkey Input */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Admin Passkey (Optional Override)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Defaults to Environment Key</span>
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="••••••••••••••••••••"
              disabled={isClearing}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50/50"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 animate-shake">
              {errorMsg}
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isClearing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isClearing}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                isConfirmed && !isClearing
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/25 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Purging Logs...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Confirm &amp; Clear Database
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
