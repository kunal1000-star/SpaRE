import React, { useState } from 'react';
import { 
  Brain, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Repeat, 
  Zap, 
  Layers, 
  Cloud,
  ChevronRight,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithSocial, verifyEmailOtp, resendVerificationOtp } from '../storage/auth';

export default function LoginPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP Verification State
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, name);
        if (!res.success) {
          if (res.requiresVerification) {
            setIsVerifyingOtp(true);
            setSuccess('Verification code sent to your email! Please enter it below.');
          } else {
            setError(res.error || 'Failed to create account.');
          }
        } else {
          setSuccess('Account created successfully! Logging you in...');
          setTimeout(() => {
            onAuthSuccess(res.user);
          }, 600);
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          if (res.requiresVerification) {
            setIsVerifyingOtp(true);
            setError('');
            setSuccess('Email verification required. We have sent a code to your email.');
          } else {
            setError(res.error || 'Invalid email or password.');
          }
        } else {
          setSuccess('Signed in successfully! Loading your revisions...');
          setTimeout(() => {
            onAuthSuccess(res.user);
          }, 600);
        }
      }
    } catch (err) {
      const errMsg = err.message || 'An error occurred during authentication.';
      if (errMsg.toLowerCase().includes('verification')) {
        setIsVerifyingOtp(true);
        setError('');
        setSuccess('Email verification required. Please enter the code sent to your email.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setError('Please enter the verification code.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await verifyEmailOtp(email, cleanOtp);
      if (!res.success) {
        setError(res.error || 'Invalid or expired code. Please try again.');
      } else {
        setSuccess('Email verified successfully! Logging you in...');
        if (password) {
          const loginRes = await signInWithEmail(email, password);
          if (loginRes.success) {
            setTimeout(() => onAuthSuccess(loginRes.user), 600);
            return;
          }
        }
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setError('Please provide your email address first.');
      return;
    }
    setResendingOtp(true);
    setOtpSentMessage('');
    setError('');
    try {
      const res = await resendVerificationOtp(email);
      if (res.success) {
        setOtpSentMessage('A fresh verification code has been sent to your email!');
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleSocialGoogle = async () => {
    setError('');
    try {
      const res = await signInWithSocial('google');
      if (!res.success) {
        setError(res.error || 'Google sign-in could not be initiated.');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060709] starry-bg text-zinc-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient vignettes & starlight halos */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/[0.03] blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-indigo-500/[0.03] blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.02] blur-[160px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          {/* Logo */}
          <div className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-white via-zinc-400 to-zinc-600 p-[1.5px] shadow-xl shadow-white/10 group-hover:shadow-white/25 transition-all">
              <div className="w-full h-full bg-[#0B0C10] rounded-[14px] flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>SpaRE</span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  v2.0
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium">Spaced Revision Engine &bull; Cloud Workspace</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              Master subjects permanently without forgetting.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0">
              Personalized 5-stage spaced repetition with dynamic cascade shifts, multi-track alignment (College, GATE, Nvidia, AMD), and real-time cloud sync.
            </p>
          </div>

          {/* Core Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto lg:mx-0">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>5-Stage Core Quota</span>
              </div>
              <p className="text-[11px] text-zinc-400">1d &bull; 3d &bull; 7d &bull; 14d &bull; 30d interval reinforcement</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                <Repeat className="w-4 h-4 text-emerald-400" />
                <span>Infinite Retention</span>
              </div>
              <p className="text-[11px] text-zinc-400">Recurring 30-day maintenance loops after Stage 5 mastery</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Multi-Track Tagging</span>
              </div>
              <p className="text-[11px] text-zinc-400">1 topic aligns across College, GATE, and Company tracks</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                <Cloud className="w-4 h-4 text-indigo-400" />
                <span>Realtime Cloud Sync</span>
              </div>
              <p className="text-[11px] text-zinc-400">Direct encrypted cloud database sync with zero lag</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="glass-modal rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden animate-modal-pop">
            {/* Ambient Top Card Glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

            {isVerifyingOtp ? (
              /* OTP Email Verification Screen */
              <div className="space-y-4 animate-fade-in">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
                    <KeyRound className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Enter Verification Code</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      A real 6-digit verification code has been sent to:
                    </p>
                    <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5 break-all">{email}</p>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-center mb-1.5">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={12}
                      placeholder="123456"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.trim())}
                      className="w-full glass-input rounded-2xl px-4 py-3.5 text-center text-xl font-mono font-black tracking-[0.3em] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-2 text-xs text-emerald-300 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  {otpSentMessage && (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center space-x-2 text-xs text-blue-300 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpSentMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 active:scale-98 glass-btn light-sweep disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <span>{loading ? 'Verifying Code...' : 'Verify Code & Enter SpaRE'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
                    <button
                      type="button"
                      onClick={() => { setIsVerifyingOtp(false); setError(''); setSuccess(''); }}
                      className="text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back / Change Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendingOtp}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                      <span>{resendingOtp ? 'Sending...' : 'Resend Code'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Standard Sign In / Sign Up Screen */
              <>
                {/* Mode Switcher */}
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900/90 border border-white/[0.08] mb-5">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      mode === 'signin' 
                        ? 'bg-white text-black shadow-md shadow-white/20' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      mode === 'signup' 
                        ? 'bg-white text-black shadow-md shadow-white/20' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Social Login Button */}
                <button
                  type="button"
                  onClick={handleSocialGoogle}
                  className="w-full py-2.5 px-4 rounded-2xl glass-panel hover:border-white/25 text-zinc-200 text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all glass-btn mb-4 active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center space-x-3 text-zinc-600 text-[10px] font-mono uppercase tracking-wider mb-4">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span>or email</span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                        Your Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kunal Rajak"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="student@prep.edu"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Password
                      </label>
                      <span className="text-[10px] text-zinc-500">Min 6 characters</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-2 text-xs text-emerald-300 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 active:scale-98 glass-btn light-sweep disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <span>{loading ? 'Authenticating...' : mode === 'signup' ? 'Create Account & Enter' : 'Sign In to SpaRE'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Direct link for users who already have an OTP code in email */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!email.trim()) {
                          setError('Please enter your email above, then click Enter Code.');
                          return;
                        }
                        setIsVerifyingOtp(true);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      Already have an email verification code? <span className="underline font-bold">Enter Code</span>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Cloud Security Note */}
            <div className="pt-4 mt-4 border-t border-white/[0.08] text-center space-y-1">
              <p className="text-[10px] text-zinc-400 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Protected by Secure Encrypted Cloud Authentication</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
