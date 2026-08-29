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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Deep Backdrop */}
      <div
        className="fixed inset-0 bg-[#02042b]/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10 text-white shadow-2xl"
        style={{
          background: 'linear-gradient(165deg, rgba(12, 35, 64, 0.96) 0%, rgba(4, 12, 26, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          animation: 'fadeSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white font-sans">
                  Admin Authorization
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Passkey verification required to purge recovery database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isClearing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleExecute} className="p-6 space-y-5">
          {/* Warning Banner */}
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200/90 leading-relaxed font-normal">
              This action will permanently delete all <strong>recovery transactions</strong>, <strong>AI diagnosis logs</strong>, and <strong>audit records</strong> from PostgreSQL.
            </div>
          </div>

          {/* Admin Passkey Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Admin Security Passkey <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-[#0c83ff]" />
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
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-white placeholder:text-slate-500 bg-[#030914]/80 transition-all font-mono ${
                  errorMsg 
                    ? 'border-red-500/70 focus:ring-2 focus:ring-red-500/40 focus:border-red-500' 
                    : 'border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]/40 focus:border-[#0c83ff]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Safety Checkbox */}
          <label className="flex items-start gap-3 pt-0.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => {
                setIsAcknowledged(e.target.checked);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isClearing}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#030914] text-[#0c83ff] focus:ring-[#0c83ff]/40 cursor-pointer"
            />
            <span className="text-xs text-slate-300 font-medium leading-relaxed">
              I understand this action is irreversible and purges all live recovery data.
            </span>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs font-semibold text-red-300 flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isClearing}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isClearing}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                isValid && !isClearing
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 cursor-pointer active:scale-98'
                  : 'bg-white/5 text-slate-400 border border-white/10 opacity-70 cursor-not-allowed'
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
                  <span>Clear Recovery Logs</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
