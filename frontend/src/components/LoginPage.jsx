import React, { useState } from 'react';
import { IndianRupee, Shield, Headphones, User, KeyRound, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';
import { loginAdmin } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('support'); // 'support' | 'admin'
  const [username, setUsername] = useState('Support Agent');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setUsername(role === 'admin' ? 'Administrator' : 'Support Agent');
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
          token: data.token
        });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials or security passkey';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-10"
      style={{ 
        fontFamily: "'Inter', sans-serif",
        background: 'radial-gradient(ellipse at 50% 0%, #0c2340 0%, #03081a 65%, #02042b 100%)'
      }}
    >
      {/* Background Radiant Atmosphere */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-[#0c83ff]/20 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none" />
      
      {/* Geometric Ambient Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Content Layout Card */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center z-10">

        {/* ── Left Column: Brand & Architecture ── */}
        <div className="lg:col-span-6 space-y-7 text-white">
          
          {/* Razorpay Brand Header */}
          <div className="flex items-center gap-3.5">
            <img
              src="/favicon.svg"
              alt="Razorpay AI Recovery Logo"
              className="w-12 h-12 rounded-2xl shrink-0 shadow-lg"
              style={{
                boxShadow: '0 8px 30px rgba(12, 131, 255, 0.4)',
              }}
            />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white font-sans">Razorpay</span>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0c83ff]/20 text-[#38a5ff] border border-[#0c83ff]/40">
                  AI Recovery
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">
                Autonomous Revenue Protection System
              </p>
            </div>
          </div>

          {/* Core Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
              Real-time payment <br />
              failure triage &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0c83ff] via-[#40a9ff] to-[#34d399]">
                revenue recovery
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal max-w-md">
              Enterprise-grade autonomous recovery engine detecting gateway drop-offs, executing multi-channel customer communications, and maximizing transaction success.
            </p>
          </div>

          {/* Pillars List */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3.5 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#38a5ff] shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">Sub-second webhook ingestion &amp; idempotency safety</span>
            </div>

            <div className="flex items-center gap-3.5 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">LLM-powered root cause diagnosis &amp; bilingual recovery (English / Hinglish)</span>
            </div>

            <div className="flex items-center gap-3.5 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">Zero-trust audit trail with AES-256 field-level encryption</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: High-End Auth Glass Card ── */}
        <div className="lg:col-span-6">
          <div 
            className="w-full rounded-3xl p-8 sm:p-9 relative overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(12, 35, 64, 0.85) 0%, rgba(6, 18, 36, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(12, 131, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Top Card Title */}
            <div className="space-y-1 pb-6">
              <h2 className="text-xl font-black text-white tracking-tight font-sans">
                Portal Sign In
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Authenticate with your team credentials to access the console
              </p>
            </div>

            {/* Role Switcher Pill Bar */}
            <div className="p-1 rounded-2xl bg-[#030914]/80 border border-white/10 grid grid-cols-2 gap-1.5 mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange('support')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'support'
                    ? 'bg-[#0c83ff] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Customer Support</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-[#0c83ff] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>System Admin</span>
              </button>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Identifier Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {selectedRole === 'admin' ? 'Administrator ID' : 'Support Specialist ID'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={selectedRole === 'admin' ? 'Administrator' : 'Support Agent'}
                    disabled={loading}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] transition-all"
                  />
                </div>
              </div>

              {/* Passkey Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Security Passkey
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="security-passkey"
                    id="security-passkey"
                    autoComplete="current-password"
                    data-lpignore="true"
                    value={passkey}
                    onChange={(e) => {
                      setPasskey(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder={selectedRole === 'admin' ? 'Enter Admin Passkey' : 'Enter Support Passkey'}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] transition-all"
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

              {/* Error Notification */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs font-semibold text-red-300 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !passkey.trim()}
                  className={`w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loading || !passkey.trim()
                      ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#0c83ff] to-[#005edb] hover:from-[#1f8eff] hover:to-[#006ef5] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Recovery Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
