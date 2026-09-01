import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, AlertTriangle, KeyRound, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

export default function ClearLogsModal({ isOpen, onClose, onConfirm, isClearing }) {
  const [adminPasskey, setAdminPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Automatically reset all inputs every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setAdminPasskey('');
      setShowPassword(false);
      setIsAcknowledged(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = adminPasskey.trim().length > 0 && isAcknowledged;

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!adminPasskey.trim()) {
      setErrorMsg('Please enter the Admin Security Passkey.');
      return;
    }
    if (!isAcknowledged) {
      setErrorMsg('Please confirm acknowledgment before proceeding.');
      return;
    }
    setErrorMsg('');
    const key = adminPasskey.trim();
    await onConfirm(key);
    // Instant memory sanitization
    setAdminPasskey('');
    setIsAcknowledged(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    if (isClearing) return;
    setAdminPasskey('');
    setShowPassword(false);
    setIsAcknowledged(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-[#0c2340]/55 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
      />

      {/* Standardized Razorpay Modal Container */}
      <div
        className="relative w-full max-w-md my-auto rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Standardized Corporate Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0c2340] via-[#0f2d52] to-[#0c83ff] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-red-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-sans tracking-tight">Admin Authorization</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/25 text-red-200 border border-red-400/30 uppercase tracking-wider">
                  Protected
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Passkey verification required to purge database
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isClearing}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer outline-none focus:outline-none"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body Content */}
        <form onSubmit={handleExecute} className="p-5 space-y-4 overflow-y-auto bg-white">
          {/* Warning Banner */}
          <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 leading-relaxed font-medium">
              This action will permanently delete all <strong>recovery transactions</strong>, <strong>AI diagnosis logs</strong>, and <strong>audit records</strong>.
            </div>
          </div>

          {/* Admin Passkey Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Admin Security Passkey <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-3.5 h-3.5 text-[#0c83ff]" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="admin-authorization-passkey"
                id="admin-authorization-passkey"
                autoComplete="one-time-code"
                data-lpignore="true"
                value={adminPasskey}
                onChange={(e) => {
                  setAdminPasskey(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter Admin Passkey"
                disabled={isClearing}
                autoFocus
                className={`w-full pl-9 pr-10 py-2 rounded-xl border text-xs font-mono text-slate-900 placeholder:text-slate-400 bg-white transition-all shadow-2xs outline-none ${
                  errorMsg 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100' 
                    : 'border-slate-300 focus:border-[#0c83ff] focus:ring-2 focus:ring-blue-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer outline-none"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Safety Checkbox */}
          <label className="flex items-start gap-2.5 pt-0.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => {
                setIsAcknowledged(e.target.checked);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isClearing}
              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-[#0c83ff] focus:ring-[#0c83ff] cursor-pointer"
            />
            <span className="text-xs text-slate-600 font-medium leading-tight">
              I understand this action is irreversible and purges all live recovery data.
            </span>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 3. Standardized Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isClearing}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#0c2340] bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isClearing}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all outline-none ${
                isValid && !isClearing
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Clearing Logs...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
