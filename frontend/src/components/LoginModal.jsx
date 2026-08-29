import React, { useState } from 'react';
import { ShieldCheck, User, KeyRound, Eye, EyeOff, Loader2, X, AlertCircle, IndianRupee, Headphones, Shield } from 'lucide-react';
import { loginAdmin } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('support'); // 'support' or 'admin'
  const [username, setUsername] = useState('support_agent');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setUsername(role === 'admin' ? 'admin' : 'support_agent');
    setPasskey('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setErrorMsg('Please enter your security passkey');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await loginAdmin(username.trim(), passkey.trim());
      if (data.success) {
        onLoginSuccess({
          username: data.username || username,
          role: data.role || selectedRole,
          email: data.email || (data.role === 'admin' ? 'admin@razorpay.internal' : 'support@razorpay.com'),
          passkey: passkey.trim(),
          token: data.token
        });
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials or security passkey';
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#02042b]/70 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        style={{
          animation: 'fadeSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Hero */}
        <div
          className="relative px-7 pt-7 pb-6 text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #02042b 0%, #0c2340 60%, #0c83ff 100%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(12, 131, 255, 0.4) 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <IndianRupee className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>

            <div>
              <h3 className="text-base font-bold tracking-tight text-white font-sans">
                Portal Authentication
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                AI Autonomous Revenue Protection Engine
              </p>
            </div>
          </div>

          {/* Role Selection Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleRoleChange('support')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'support'
                  ? 'bg-white text-[#0c2340] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Customer Support</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-white text-[#0c2340] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>System Admin</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {/* Role Description Helper */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            {selectedRole === 'support' ? (
              <>
                <Headphones className="w-4 h-4 text-[#0c83ff] shrink-0" />
                <span>Customer Support: View recovery audit logs &amp; communication templates.</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-[#0c83ff] shrink-0" />
                <span>System Admin: Full configuration and database maintenance.</span>
              </>
            )}
          </div>

          {/* User Identifier */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              User Identifier / Agent ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'admin' : 'support_agent'}
                disabled={loading}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] bg-slate-50/60"
              />
            </div>
          </div>

          {/* Security Passkey */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Security Passkey
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedRole === 'admin' ? 'ADMIN_PASSKEY' : 'SUPPORT_KEY'}
              </span>
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
                placeholder={selectedRole === 'admin' ? 'Enter Admin Passkey' : 'Enter Support Passkey'}
                disabled={loading}
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] bg-slate-50/60 placeholder:text-slate-400"
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
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || !passkey.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                loading || !passkey.trim()
                  ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
                  : 'bg-[#0c83ff] hover:bg-[#0070eb] shadow-blue-500/25 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sign In as {selectedRole === 'admin' ? 'Administrator' : 'Customer Support'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
