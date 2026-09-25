import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Edit2,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import solarGridVideo from '../assets/images/Solar Grid.mp4';

export default function Login() {
  const { loginWithAuthResponse, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to reservations or target page
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/reservations';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Auth Mode: 'password' (Email or Username + Password) | 'otp' (One-Time Passcode to Registered Email)
  const [authMode, setAuthMode] = useState('password');

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // OTP Login State
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1 = Identifier, 2 = 6-Digit OTP Code
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  const otpInputsRef = useRef([]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // --- PASSWORD LOGIN SUBMIT ---
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      toast.error('Please enter your email or username.');
      return;
    }

    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    try {
      setLoggingIn(true);
      const authResponse = await authApi.login(trimmedIdentifier, password);
      loginWithAuthResponse(authResponse);

      const userGreeting = authResponse.user?.fullName || authResponse.user?.username || authResponse.user?.email;
      toast.success(`Welcome back, ${userGreeting}!`, { icon: '⚡' });

      const userRole = authResponse.user?.role?.toLowerCase();
      let destination = location.state?.from?.pathname;
      if (destination && destination.startsWith('/admin') && userRole !== 'admin') {
        destination = '/reservations';
      }
      if (!destination) {
        destination = userRole === 'admin' ? '/admin/approvals' : '/reservations';
      }
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email/username or password.';
      toast.error(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  // --- OTP SEND (LOOKS UP REGISTERED USER & AUTOMATICALLY FETCHES EMAIL) ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    const trimmed = otpIdentifier.trim();
    if (!trimmed) {
      toast.error('Please enter your registered email or username.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await authApi.sendLoginOtp(trimmed);
      setMaskedEmail(res.maskedEmail || 'your registered email');
      toast.success(res.message || `Passcode dispatched to ${res.maskedEmail}!`);

      setOtpStep(2);
      setCooldown(60);
      setAttemptsRemaining(5);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 250);
    } catch (err) {
      const msg = err.response?.data?.message || 'No registered account found with that email or username.';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // --- OTP DIGIT CHANGES ---
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
      handleVerifyOtp(pastedData);
    } else {
      toast.error('Pasted content must be exactly 6 digits.');
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const finalOtp = typeof codeToVerify === 'string' ? codeToVerify : otp.join('');
    if (finalOtp.length !== 6) {
      toast.error('Please enter all 6 digits of your passcode.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const authResponse = await authApi.verifyOtp(otpIdentifier.trim(), finalOtp);
      loginWithAuthResponse(authResponse);

      const userGreeting = authResponse.user?.fullName || authResponse.user?.username || 'Member';
      toast.success(`Welcome back, ${userGreeting}!`, { icon: '⚡' });

      const userRole = authResponse.user?.role?.toLowerCase();
      let destination = location.state?.from?.pathname;
      if (destination && destination.startsWith('/admin') && userRole !== 'admin') {
        destination = '/reservations';
      }
      if (!destination) {
        destination = userRole === 'admin' ? '/admin/approvals' : '/reservations';
      }
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code.';
      toast.error(msg);

      setAttemptsRemaining((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="dashboard-container min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFD000]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FFD000]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="glass-card max-w-lg w-full p-8 sm:p-10 relative z-10 border border-white/10 shadow-2xl"
      >
        {/* Header with Video Pill & Branding */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#FFD000]/60 shadow-xl shadow-black/80 relative flex-shrink-0">
            <video
              src={solarGridVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD000] px-2.5 py-0.5 rounded-full bg-[#FFD000]/15 border border-[#FFD000]/30">
                Secure Access
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                API v1.0
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Solar Microgrid
            </h1>
            <p className="text-xs text-slate-400 tracking-wide">
              Decentralized Energy Trading &amp; Slot Management
            </p>
          </div>
        </div>

        {/* Authentication Mode Switcher Tabs */}
        <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              authMode === 'password'
                ? 'bg-[#FFD000] text-black shadow-lg shadow-[#FFD000]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              authMode === 'otp'
                ? 'bg-[#FFD000] text-black shadow-lg shadow-[#FFD000]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>One-Time Passcode</span>
          </button>
        </div>

        {/* Mode 1: Email or Username & Password */}
        {authMode === 'password' && (
          <motion.form
            key="password-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handlePasswordLogin}
            className="space-y-4"
          >
            {/* Email or Username Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Registered Email or Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. operator@solarmicrogrid.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full yellow-pill-btn py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-[#FFD000]/20 disabled:opacity-50 mt-2"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* Mode 2: One-Time Passcode to Registered User's Email */}
        {authMode === 'otp' && (
          <AnimatePresence mode="wait">
            {otpStep === 1 ? (
              <motion.form
                key="otp-step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                {/* Registered Account Identifier */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Registered Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. rivinma_solar or operator@solarmicrogrid.com"
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FFD000]" /> Registered Accounts Only
                  </p>
                  <p>
                    Enter the username or email you registered with. We will look up your account and dispatch a verification passcode to your email.
                  </p>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full yellow-pill-btn py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-[#FFD000]/20 disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Looking up Account &amp; Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Passcode to Registered Email</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp-step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Destination Summary with Masked Email */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD000] px-2 py-0.5 rounded-md bg-[#FFD000]/10 border border-[#FFD000]/20 inline-flex items-center gap-1">
                      <Inbox className="w-3 h-3" />
                      Passcode Dispatched
                    </span>
                    <p className="text-xs text-slate-400">
                      Sent to registered address:
                    </p>
                    {/* User-facing masked email (e.g. sa•••••a@domain.com) */}
                    <p className="text-sm font-bold font-mono text-white tracking-wide">
                      {maskedEmail}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Account: <strong className="text-slate-300">@{otpIdentifier}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-all flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                    Change
                  </button>
                </div>

                {/* 6-Digit OTP Box Grid */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 text-center">
                    Enter 6-Digit Passcode
                  </label>
                  <div
                    className="flex items-center justify-center gap-2 sm:gap-3"
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-mono font-black rounded-2xl bg-white/[0.04] border text-white focus:outline-none transition-all ${
                          digit
                            ? 'border-[#FFD000] bg-[#FFD000]/10 shadow-lg shadow-[#FFD000]/10 text-[#FFD000]'
                            : 'border-white/15 focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40'
                        }`}
                      />
                    ))}
                  </div>
                  {attemptsRemaining !== null && (
                    <p className="text-center text-[11px] text-slate-400 mt-2.5">
                      Security Policy: {attemptsRemaining} attempt(s) remaining.
                    </p>
                  )}
                </div>

                {/* Verification Button */}
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={verifyingOtp || otp.some((d) => !d)}
                  className="w-full yellow-pill-btn py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-[#FFD000]/20 disabled:opacity-40"
                >
                  {verifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Authenticating Token...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-black" />
                      <span>Verify Passcode &amp; Sign In</span>
                    </>
                  )}
                </button>

                {/* Cooldown & Resend Actions */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    &larr; Back
                  </button>

                  {cooldown > 0 ? (
                    <span className="text-slate-500 font-medium">
                      Resend code in <strong className="text-slate-300">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={sendingOtp}
                      className="text-[#FFD000] hover:text-yellow-300 font-bold transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${sendingOtp ? 'animate-spin' : ''}`} />
                      Resend Passcode
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Development Helper Badge */}
        <div className="mt-6 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#FFD000] flex-shrink-0" />
          <span>
            Only registered accounts can log in. Passwords or OTP codes sent to your registered inbox are accepted.
          </span>
        </div>

        {/* Toggle to Registration */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
          <p className="text-xs text-slate-400">
            Don't have a microgrid account?{' '}
            <Link
              to="/register"
              className="text-[#FFD000] hover:text-yellow-300 font-bold transition-colors ml-1 inline-flex items-center gap-1"
            >
              <span>Register New Account</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
