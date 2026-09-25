import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  SunMedium,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  Edit2,
  CheckCircle2,
  FileBadge,
  AtSign,
  Sun,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import solisFacilityImg from '../assets/images/solis-facility.jpg';

const ROLES = [
  { id: 'Prosumer', label: 'Prosumer', icon: Sun },
  { id: 'Admin', label: 'Operator', icon: ShieldCheck },
  { id: 'Consumer', label: 'Consumer', icon: Users },
];

export default function Register() {
  const { loginWithAuthResponse, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to reservations
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/reservations', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('Prosumer');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP State
  const [step, setStep] = useState(1); // 1 = Details, 2 = 6-Digit OTP
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Submit Details & Send OTP
  const handleInitiateRegistration = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error('Please choose a username.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the microgrid terms.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await authApi.sendOtp(trimmedEmail, role);
      toast.success(res.message || 'Verification code sent to your email!');

      setStep(2);
      setCooldown(60);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification code.';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Handle OTP Digits
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      handleCompleteRegistration(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
      handleCompleteRegistration(pasted);
    } else {
      toast.error('Passcode must be exactly 6 digits.');
    }
  };

  // Step 2: Complete Registration
  const handleCompleteRegistration = async (codeToVerify) => {
    const finalOtp = typeof codeToVerify === 'string' ? codeToVerify : otp.join('');
    if (finalOtp.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    try {
      setVerifying(true);
      const authResponse = await authApi.register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
        fullName: fullName.trim() || undefined,
        nic: nic.trim() || undefined,
        role,
        otp: finalOtp,
        deviceInfo: `Web (${fullName || username})`,
      });

      loginWithAuthResponse(authResponse);

      if (authResponse.user?.approvalStatus === 'PendingApproval') {
        toast.success(
          'Registration complete! Prosumer accounts require operator approval before trading.',
          { duration: 6000, icon: '⏳' }
        );
      } else {
        toast.success(`Welcome to Solis Microgrid, ${fullName || username}!`, { icon: '⚡' });
      }

      navigate('/reservations', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code.';
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="operations-shell min-h-screen flex flex-col justify-between">
      {/* Top Minimal Brand Bar */}
      <header className="operations-topbar !grid-template-columns-none flex items-center justify-between px-6 sm:px-12 py-4">
        <Link to="/" className="inline-flex items-center gap-3 text-[#f0f0e8] no-underline">
          <span className="w-8 h-8 rounded-lg bg-[#111410] border border-[#2a2f27] flex items-center justify-center text-[#e9f85b]">
            <SunMedium className="w-4 h-4" />
          </span>
          <span className="font-semibold text-sm">Solis microgrid</span>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <Link to="/" className="text-[#92988d] hover:text-[#f0f0e8] transition-colors no-underline">
            Overview
          </Link>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#f0f0e8] bg-[#151914] hover:bg-[#1f241d] border border-[#2a2f27] transition-all no-underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Architecture */}
      <main className="flex-1 grid lg:grid-cols-12 min-h-[calc(100vh-74px)]">
        {/* Left Column: Clean Full-Bleed Solar Photography */}
        <section className="lg:col-span-6 relative overflow-hidden flex flex-col justify-between p-8 sm:p-14 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#2a2f27]">
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

          {/* Top Indicator - Prominent standard font */}
          <div className="relative z-10 mb-3">
            <span className="text-sm sm:text-base font-normal text-[#e9f85b] tracking-wide font-sans">
              Join the microgrid
            </span>
          </div>

          {/* Center Main Headline - Matching Reservation Screen Editorial Style */}
          <div className="relative z-10 max-w-lg my-auto py-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#f0f0e8] tracking-[-0.04em] leading-[1.06] mb-4">
              Decentralized <br />
              <em className="text-[#e9f85b] font-normal italic font-serif">solar power.</em>
            </h1>
            <p className="text-sm sm:text-base text-[#92988d] font-light leading-relaxed">
              Register your profile to book energy slots, inject power into regional nodes, or oversee grid operations.
            </p>
          </div>

          {/* Bottom Simple Caption */}
          <div className="relative z-10 text-xs text-[#666c63]">
            Solis Microgrid Platform
          </div>
        </section>

        {/* Right Column: Ultra-Minimal Registration Form */}
        <section className="lg:col-span-6 flex flex-col justify-center p-6 sm:p-12 lg:p-16 bg-[#111410] relative overflow-y-auto">
          <div className="max-w-md w-full mx-auto py-4">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-light text-[#f0f0e8] tracking-tight mb-1">
                Create <em className="text-[#e9f85b] font-normal italic font-serif">account.</em>
              </h2>
              <p className="text-xs text-[#92988d]">
                {step === 1 ? 'Enter your details to get started.' : 'Verify your email address.'}
              </p>
            </div>

            {/* Step 1 Form */}
            {step === 1 && (
              <form onSubmit={handleInitiateRegistration} className="space-y-4">
                {/* Role Pill Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#92988d] mb-1.5">
                    Account type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const isSelected = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#e9f85b] text-[#0b0d0b] border-[#e9f85b] font-medium shadow-sm'
                              : 'bg-[#151914] text-[#92988d] border-[#2a2f27] hover:text-[#f0f0e8]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & NIC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      NIC number
                    </label>
                    <div className="relative">
                      <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type="text"
                        required
                        placeholder="National ID"
                        value={nic}
                        onChange={(e) => setNic(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type="text"
                        required
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666c63] hover:text-[#f0f0e8]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666c63] hover:text-[#f0f0e8]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#151914] border-[#2a2f27] text-[#e9f85b] cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-[#92988d] cursor-pointer">
                    I agree to the Solis Microgrid terms and conditions.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full mt-3 py-3 px-4 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0b0d0b]" />
                      <span>Sending verification code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2 Form: OTP Verification */}
            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCompleteRegistration();
                }}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-[#151914] border border-[#2a2f27] flex items-center justify-between text-xs">
                  <div className="text-[#92988d]">
                    Code sent to: <span className="text-[#f0f0e8] font-medium">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    className="text-[#e9f85b] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#92988d] mb-2">
                    Enter 6-digit code
                  </label>
                  <div className="flex gap-2 justify-between" onPaste={handlePaste}>
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
                        className="w-11 sm:w-12 h-12 text-center text-lg font-bold font-mono rounded-xl bg-[#151914] border border-[#2a2f27] text-[#e9f85b] focus:border-[#e9f85b] focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || otp.join('').length !== 6}
                  className="w-full py-3 px-4 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0b0d0b]" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Complete registration</span>
                  )}
                </button>

                <div className="text-center pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleInitiateRegistration}
                    disabled={cooldown > 0 || sendingOtp}
                    className="text-[#92988d] hover:text-[#f0f0e8] disabled:opacity-40"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#2a2f27] text-xs flex items-center justify-between">
              <span className="text-[#92988d]">Already registered?</span>
              <Link to="/login" className="font-semibold text-[#e9f85b] hover:underline no-underline">
                Sign in →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
