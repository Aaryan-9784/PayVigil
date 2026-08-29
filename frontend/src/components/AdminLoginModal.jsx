import React, { useState } from 'react';
import { ShieldCheck, Lock, User, KeyRound, Eye, EyeOff, Loader2, X, AlertCircle, IndianRupee, Sparkles } from 'lucide-react';
import { loginAdmin } from '../api';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setErrorMsg('Please enter your Admin Passkey');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await loginAdmin(username.trim(), passkey.trim());
      if (data.success) {
        onLoginSuccess({
          username: data.username || username,
          role: 'admin',
          passkey: passkey.trim(),
          token: data.token
        });
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid admin credentials or passkey';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setPasskey('');
    setErrorMsg('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Ambient Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-[#02042b]/75 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10"
        style={{
          animation: 'fadeSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 25px 50px -12px rgba(12, 131, 255, 0.25), 0 0 0 1px rgba(12, 131, 255, 0.1)'
        }}
      >
        {/* Header Hero Section */}
        <div
          className="relative px-8 pt-8 pb-7 text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #02042b 0%, #0c2340 60%, #0c83ff 100%)',
          }}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#0c83ff]/30 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            {/* Razorpay Rupee Orb */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(12, 131, 255, 0.4) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <IndianRupee className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white font-sans">
                  Admin Gateway
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0c83ff]/30 text-blue-200 border border-[#0c83ff]/40">
                  Level 3 Security
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                AI Autonomous Revenue Protection Console
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4.5">
          {/* Username / Identifier */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Admin Identifier
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                disabled={loading}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] bg-slate-50/70"
              />
            </div>
          </div>

          {/* Admin Passkey */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Security Passkey
              </label>
              <span className="text-[11px] text-[#0c83ff] font-semibold">ADMIN_PASSKEY</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter Admin Passkey"
                disabled={loading}
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] bg-slate-50/70 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !passkey.trim()}
              className={`w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                loading || !passkey.trim()
                  ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
                  : 'bg-gradient-to-r from-[#0c83ff] to-[#0052cc] hover:from-[#0070eb] hover:to-[#0047b3] shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <p className="text-[11px] text-slate-400 font-medium">
              Enterprise cryptographic session • AES-256 protected
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
