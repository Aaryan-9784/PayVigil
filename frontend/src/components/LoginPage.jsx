import React, { useState } from 'react';
import { Mail, Lock, User, KeyRound, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { loginAdmin, signupUser, requestPasswordReset, verifyResetCode, resetUserPassword } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  // ── Auth Mode ('login' | 'signup') ──
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // ── Sign In States ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // ── Sign Up States ──
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // ── General Form States ──
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Forgot Password Modal States ──
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Passkey
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // ── Password Strength Calculator ──
  const computeStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 66, label: 'Good', color: 'bg-amber-400' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-400' };
  };

  const signupStrength = computeStrength(signupPassword);
  const resetStrength = computeStrength(newPasskey);

  // ── Handle Sign In (Email & Password) ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!loginPassword.trim()) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await loginAdmin(loginEmail.trim(), loginPassword.trim());
      if (data.success) {
        onLoginSuccess({
          username: data.username || data.email,
          role: data.role || 'admin',
          email: data.email || loginEmail.trim(),
          token: data.token,
          user: data.user
        });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Sign Up (Register New User) ──
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMsg('Please enter a valid work email address');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify confirmation.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await signupUser(
        signupName.trim(),
        signupEmail.trim(),
        signupPassword.trim(),
        'support'
      );
      if (data.success) {
        setSuccessMsg(`Welcome, ${data.username}! Redirecting to dashboard...`);
        setTimeout(() => {
          onLoginSuccess({
            username: data.username,
            role: data.role,
            email: data.email,
            token: data.token,
            user: data.user
          });
        }, 800);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Account registration failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password Request ──
  const handleRequestResetCode = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email address');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await requestPasswordReset(forgotIdentifier.trim());
      if (res.success) {
        setForgotSuccess(res.message);
        setForgotStep(2);
      }
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Account not found. Please verify your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Forgot Password OTP Verify ──
  const handleVerifyResetCode = async () => {
    if (forgotOtp.length !== 6) {
      setForgotError('Please enter the full 6-digit verification code');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await verifyResetCode(forgotIdentifier.trim(), forgotOtp.trim());
      if (res.success) {
        setForgotSuccess('Code verified! Enter your new password below.');
        setForgotStep(3);
      }
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Invalid or expired code. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Forgot Password Reset Execution ──
  const handleExecuteResetPassword = async () => {
    if (newPasskey.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }
    if (newPasskey !== confirmPasskey) {
      setForgotError('Passwords do not match. Please check confirmation.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await resetUserPassword(forgotIdentifier.trim(), forgotOtp.trim(), newPasskey.trim());
      if (res.success) {
        setForgotSuccess(res.message);
        setTimeout(() => {
          setShowForgotModal(false);
          onLoginSuccess({
            username: res.username || 'Aryan Patel',
            role: res.role || 'admin',
            email: res.email || forgotIdentifier.trim(),
            token: res.token
          });
        }, 1000);
      }
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Password reset failed. Please request a fresh code.');
    } finally {
      setForgotLoading(false);
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
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-[#0c83ff]/15 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />
      
      {/* Ambient Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center z-10">

        {/* ── Left Column: Brand & Architecture ── */}
        <div className="lg:col-span-6 space-y-7 text-white">
          
          {/* Brand Header */}
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
                Autonomous Revenue Protection Platform
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Turn payment failures into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38a5ff] via-[#60a5fa] to-[#34d399]">
                recovered revenue
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Autonomous AI diagnostics, real-time banking rails monitoring, and instant smart retries 
              engineered to prevent checkout revenue loss.
            </p>
          </div>

          {/* Key Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3.5 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#38a5ff] shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">Sub-second webhook ingestion &amp; idempotency protection</span>
            </div>

            <div className="flex items-center gap-3.5 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">AI root cause diagnosis &amp; bilingual customer communication</span>
            </div>

            <div className="flex items-center gap-3.5 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">Enterprise security with PBKDF2 hashing &amp; signed JWT tokens</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Clean Authentication Glass Card ── */}
        <div className="lg:col-span-6">
          <div 
            className="w-full rounded-3xl p-8 sm:p-9 relative overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(12, 35, 64, 0.85) 0%, rgba(6, 18, 36, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(12, 131, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Header Titles */}
            <div className="space-y-1.5 pb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {authMode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === 'login' 
                  ? 'Enter your email and password to access the dashboard' 
                  : 'Start recovering failed transactions autonomously'}
              </p>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* ── MODE 1: SIGN IN ── */}
            {/* ────────────────────────────────────────────────────────── */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Address Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="name@company.com"
                      disabled={loading}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotStep(1);
                        setForgotIdentifier(loginEmail || '');
                        setForgotError('');
                        setForgotSuccess('');
                        setForgotOtp('');
                        setNewPasskey('');
                        setConfirmPasskey('');
                      }}
                      className="text-xs font-semibold text-[#38a5ff] hover:text-[#70baff] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] focus:border-[#0c83ff] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#030914]/80 text-[#0c83ff] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0c83ff]"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>

                {/* Error Notification */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs font-semibold text-red-300 flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Success Notification */}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit Sign In CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !loginEmail.trim() || !loginPassword.trim()}
                    className={`w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      loading || !loginEmail.trim() || !loginPassword.trim()
                        ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#0c83ff] to-[#005edb] hover:from-[#1f8eff] hover:to-[#006ef5] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.99]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Bottom Switcher */}
                <div className="text-center pt-3 border-t border-white/10 mt-5">
                  <span className="text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="font-bold text-[#38a5ff] hover:text-[#70baff] transition-colors cursor-pointer"
                    >
                      Sign up
                    </button>
                  </span>
                </div>
              </form>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* ── MODE 2: SIGN UP ── */}
            {/* ────────────────────────────────────────────────────────── */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Full name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => {
                        setSignupName(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="John Doe"
                      disabled={loading}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] transition-all"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Work email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="name@company.com"
                      disabled={loading}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff] transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="At least 6 characters"
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Confirm password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => {
                        setSignupConfirmPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Re-enter password"
                      disabled={loading}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/60 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]"
                    />
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {signupPassword && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password strength:</span>
                      <span className={`font-semibold ${
                        signupStrength.label === 'Strong' ? 'text-emerald-400' :
                        signupStrength.label === 'Good' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {signupStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${signupStrength.color} transition-all duration-300`}
                        style={{ width: `${signupStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-[#030914]/80 text-[#0c83ff] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0c83ff]"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer select-none leading-tight">
                    I agree to the <span className="text-[#38a5ff]">Terms of Service</span> and <span className="text-[#38a5ff]">Privacy Policy</span>.
                  </label>
                </div>

                {/* Error Notification */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs font-semibold text-red-300 flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Success Notification */}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit Sign Up CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !signupEmail.trim() || !signupPassword.trim()}
                    className={`w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      loading || !signupEmail.trim() || !signupPassword.trim()
                        ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 active:scale-[0.99]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Bottom Switcher */}
                <div className="text-center pt-3 border-t border-white/10 mt-5">
                  <span className="text-xs text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="font-bold text-[#38a5ff] hover:text-[#70baff] transition-colors cursor-pointer"
                    >
                      Sign in
                    </button>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── FORGOT PASSWORD / OTP RECOVERY MODAL ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white border border-white/15 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, #0b1e36 0%, #051021 100%)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(12, 131, 255, 0.2)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[#38a5ff]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset password</h3>
                  <p className="text-xs text-slate-400">Step {forgotStep} of 3: {forgotStep === 1 ? 'Enter your email' : forgotStep === 2 ? 'Verify 6-digit code' : 'Set new password'}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full my-5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#0c83ff] to-emerald-400 h-full transition-all duration-300"
                style={{ width: forgotStep === 1 ? '33%' : forgotStep === 2 ? '66%' : '100%' }}
              />
            </div>

            {/* Error Notification */}
            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs font-semibold text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* ── STEP 1: Enter Email ── */}
            {forgotStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered account email. We'll send a 6-digit verification code valid for 15 minutes.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Email address</label>
                  <input
                    type="email"
                    value={forgotIdentifier}
                    onChange={(e) => {
                      setForgotIdentifier(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={forgotLoading || !forgotIdentifier.trim()}
                    onClick={handleRequestResetCode}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0c83ff] hover:bg-[#006ef5] flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>Send Verification Code</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Verify 6-Digit OTP ── */}
            {forgotStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Verification code dispatched to <strong className="text-white font-semibold">{forgotIdentifier}</strong> (Valid for 15 mins).
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">6-Digit verification code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => {
                      setForgotOtp(e.target.value.replace(/\D/g, ''));
                      if (forgotError) setForgotError('');
                    }}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-xl border border-white/15 bg-[#030914]/90 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]"
                  />
                </div>

                <div className="pt-3 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotOtp('');
                      setForgotError('');
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    ← Change Email
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={forgotLoading || forgotOtp.length !== 6}
                      onClick={handleVerifyResetCode}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Verify Code</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Set New Password ── */}
            {forgotStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Code verified! Enter your new password below.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">New password</label>
                  <input
                    type="password"
                    value={newPasskey}
                    onChange={(e) => {
                      setNewPasskey(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    placeholder="Min. 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]"
                  />
                </div>

                {/* Password Strength */}
                {newPasskey && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password strength:</span>
                      <span className={`font-semibold ${
                        resetStrength.label === 'Strong' ? 'text-emerald-400' :
                        resetStrength.label === 'Good' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {resetStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${resetStrength.color} transition-all duration-300`}
                        style={{ width: `${resetStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPasskey}
                    onChange={(e) => {
                      setConfirmPasskey(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#030914]/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0c83ff]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={forgotLoading || newPasskey.length < 6 || newPasskey !== confirmPasskey}
                    onClick={handleExecuteResetPassword}
                    className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0c83ff] to-emerald-500 hover:from-[#1f8eff] hover:to-emerald-400 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Update Password &amp; Sign In</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
