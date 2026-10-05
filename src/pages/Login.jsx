import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  SunMedium,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  Mail,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import solisFacilityImg from '../assets/images/solis-facility.jpg';

export default function Login() {
  const { loginWithAuthResponse, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to reservations
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/reservations';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Auth Mode: 'password' | 'otp'
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
  const [otpStep, setOtpStep] = useState(1); // 1 = Identifier, 2 = 6-Digit Code
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  // Cooldown countdown timer
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
      toast.success(`Welcome back, ${userGreeting}!`);

      const userRole = authResponse.user?.role?.toLowerCase();
      const isBackoffice = userRole === 'admin' || userRole === 'backoffice';
      let destination = location.state?.from?.pathname;
      if (destination && destination.startsWith('/admin') && !isBackoffice) {
        destination = '/reservations';
      }
      if (!destination) {
        destination = isBackoffice ? '/backoffice' : '/reservations';
      }
      navigate(destination, { replace: true });
    } catch (err) {
      let msg = err.response?.data?.message;
      if (!msg) {
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || !err.response) {
          msg = 'Unable to connect to Solar API server (port 5298). Please verify the backend is running.';
        } else {
          msg = 'Invalid email/username or password.';
        }
      }
      toast.error(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  // --- OTP SEND ---
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

      setMaskedEmail(res.maskedEmail || trimmed);
      setOtpStep(2);
      setCooldown(60);
      toast.success(`Verification code sent to ${res.maskedEmail || 'your email'}`, { icon: '📧' });

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err) {
      const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' || !err.response ? 'Cannot connect to backend server (port 5298).' : 'Failed to send verification code. Please check your credentials.');
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // --- OTP DIGIT HANDLING ---
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    if (cleanChar && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // --- OTP VERIFY SUBMIT ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const finalOtp = otp.join('');
    if (finalOtp.length !== 6) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const authResponse = await authApi.verifyOtp(otpIdentifier.trim(), finalOtp);
      loginWithAuthResponse(authResponse);

      const userGreeting = authResponse.user?.fullName || authResponse.user?.username || 'Member';
      toast.success(`Welcome back, ${userGreeting}!`);

      const userRole = authResponse.user?.role?.toLowerCase();
      const isBackoffice = userRole === 'admin' || userRole === 'backoffice';
      let destination = location.state?.from?.pathname;
      if (destination && destination.startsWith('/admin') && !isBackoffice) {
        destination = '/reservations';
      }
      if (!destination) {
        destination = isBackoffice ? '/backoffice' : '/reservations';
      }
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' || !err.response ? 'Cannot connect to backend server (port 5298).' : 'Verification failed. Please check the code.');
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="operations-shell min-h-screen flex flex-col justify-between">
      {/* Top Minimal Brand Bar */}
      <header className="operations-topbar !grid-template-columns-none flex items-center justify-between px-6 sm:px-12 py-4">
        <Link to="/" className="inline-flex items-center gap-3 text-[#f0f0e8] no-underline">
          <span className="w-8 h-8 rounded-lg bg-[#111410] border border-[#2a2f27] flex items-center justify-center p-1">
            <img src="/solar-logo.png" alt="SolarRays Logo" className="w-5 h-5 object-contain" />
          </span>
          <span className="font-semibold text-sm">SolarRays microgrid</span>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <Link to="/" className="text-[#92988d] hover:text-[#f0f0e8] transition-colors no-underline">
            Overview
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#f0f0e8] bg-[#151914] hover:bg-[#1f241d] border border-[#2a2f27] transition-all no-underline"
          >
            Create account
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Architecture */}
      <main className="flex-1 grid lg:grid-cols-12 min-h-[calc(100vh-74px)]">
        {/* Left Column: Clean Full-Bleed Solar Photography */}
        <section className="lg:col-span-7 relative overflow-hidden flex flex-col justify-between p-8 sm:p-14 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#2a2f27]">
          {/* High-Resolution Background */}
          <div className="absolute inset-0 z-0">
            <img
              src={solisFacilityImg}
              alt="Solis Solar Microgrid Facility"
              className="w-full h-full object-cover object-center"
            />
            {/* Minimal Soft Dark Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d0b] via-[#0b0d0b]/60 to-[#0b0d0b]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d0b]/80 via-transparent to-[#0b0d0b]/80" />
          </div>

          {/* Top Indicator */}
          <div className="relative z-10 mb-3">
            <span className="text-sm sm:text-base font-normal text-[#e9f85b] tracking-wide font-sans">
              SolarRays microgrid network
            </span>
          </div>

          {/* Center Main Headline */}
          <div className="relative z-10 max-w-lg my-auto py-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#f0f0e8] tracking-[-0.04em] leading-[1.06] mb-4">
              Clean solar energy, <br />
              <em className="text-[#e9f85b] font-normal italic font-serif">seamlessly traded.</em>
            </h1>
            <p className="text-sm sm:text-base text-[#92988d] font-light leading-relaxed">
              Connect solar assets to regional microgrid nodes. Schedule energy injection and dispatch power directly.
            </p>
          </div>

          {/* Bottom Simple Caption */}
          <div className="relative z-10 text-xs text-[#666c63]">
            SolarRays Microgrid Platform
          </div>
        </section>

        {/* Right Column: Ultra-Minimal Clean Auth Card */}
        <section className="lg:col-span-5 flex flex-col justify-center p-6 sm:p-12 lg:p-16 bg-[#111410] relative">
          <div className="max-w-sm w-full mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-light text-[#f0f0e8] tracking-tight mb-1">
                Sign <em className="text-[#e9f85b] font-normal italic font-serif">in.</em>
              </h2>
              <p className="text-xs text-[#92988d]">
                Enter your details to access your account.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#151914] border border-[#2a2f27] mb-6 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`py-2 rounded-lg font-medium transition-all ${
                  authMode === 'password'
                    ? 'bg-[#e9f85b] text-[#0b0d0b] font-medium shadow-sm'
                    : 'text-[#92988d] hover:text-[#f0f0e8]'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className={`py-2 rounded-lg font-medium transition-all ${
                  authMode === 'otp'
                    ? 'bg-[#e9f85b] text-[#0b0d0b] font-medium shadow-sm'
                    : 'text-[#92988d] hover:text-[#f0f0e8]'
                }`}
              >
                One-time code
              </button>
            </div>

            {/* Password Login Mode */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#92988d] mb-1.5">
                    Email or username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your email or username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#92988d]">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666c63] hover:text-[#f0f0e8]"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Login Mode */}
            {authMode === 'otp' && (
              <div className="space-y-4">
                {otpStep === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#92988d] mb-1.5">
                        Email or username
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                        <input
                          type="text"
                          required
                          placeholder="Enter your email or username"
                          value={otpIdentifier}
                          onChange={(e) => setOtpIdentifier(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingOtp || cooldown > 0}
                      className="w-full py-3 px-4 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {sendingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending code...</span>
                        </>
                      ) : cooldown > 0 ? (
                        <span>Resend in {cooldown}s</span>
                      ) : (
                        <span>Send verification code</span>
                      )}
                    </button>
                  </form>
                )}

                {otpStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 rounded-xl bg-[#151914] border border-[#2a2f27] flex items-center justify-between text-xs">
                      <div className="text-[#92988d]">
                        Sent to: <span className="text-[#f0f0e8] font-medium">{maskedEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep(1);
                          setOtp(['', '', '', '', '', '']);
                        }}
                        className="text-[#e9f85b] hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#92988d] mb-2">
                        6-digit passcode
                      </label>
                      <div className="flex gap-2 justify-between">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputsRef.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={idx === 0 ? 6 : 1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-[#151914] border border-[#2a2f27] text-[#e9f85b] focus:border-[#e9f85b] focus:outline-none transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otp.join('').length !== 6}
                      className="w-full py-3 px-4 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {verifyingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify &amp; sign in</span>
                      )}
                    </button>

                    <div className="text-center pt-1 text-xs">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={cooldown > 0 || sendingOtp}
                        className="text-[#92988d] hover:text-[#f0f0e8] disabled:opacity-40"
                      >
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#2a2f27] text-xs flex items-center justify-between">
              <span className="text-[#92988d]">Need an account?</span>
              <Link to="/register" className="font-semibold text-[#e9f85b] hover:underline no-underline">
                Create account →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
