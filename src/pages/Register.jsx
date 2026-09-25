import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sun,
  Users,
  ArrowRight,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  FileBadge,
  Sparkles,
  MapPin,
  Clock,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import solarGridVideo from '../assets/images/Solar Grid.mp4';

const REGISTRATION_ROLES = [
  {
    id: 'Prosumer',
    label: 'Solar Prosumer',
    tag: 'Solar Producer',
    description: 'Sell excess solar power & reserve capacity slots. Requires Operator verification.',
    icon: Sun,
    accent: 'text-emerald-400',
    borderActive: 'border-emerald-400 bg-emerald-400/10',
    badge: 'Requires Approval',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  },
  {
    id: 'Admin',
    label: 'Grid Operator',
    tag: 'System Supervision',
    description: 'Approve energy slot reservations, manage nodes, and audit microgrid health.',
    icon: ShieldCheck,
    accent: 'text-[#FFD000]',
    borderActive: 'border-[#FFD000] bg-[#FFD000]/10',
    badge: 'Full Access',
    badgeColor: 'text-[#FFD000] bg-[#FFD000]/10 border-[#FFD000]/30',
  },
  {
    id: 'Consumer',
    label: 'Energy Consumer',
    tag: 'Clean Energy Buyer',
    description: 'Purchase renewable solar energy, track green savings, and book consumption.',
    icon: Users,
    accent: 'text-sky-400',
    borderActive: 'border-sky-400 bg-sky-400/10',
    badge: 'Instant Activation',
    badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  },
];

const REGIONS = [
  'Western Province (Colombo North Hub)',
  'Western Province (Kaduwela Microgrid)',
  'Central Province (Kandy Central Substation)',
  'Southern Province (Galle Coastal Array)',
  'Other / Off-Grid Island Node',
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

  // Step 1: Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('Prosumer');
  const [region, setRegion] = useState(REGIONS[0]);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Step 2: 6-Digit OTP State
  const [step, setStep] = useState(1); // 1 = Details & Credentials, 2 = 6-Digit OTP Verification
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  const otpInputsRef = useRef([]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Validate Details and Send OTP
  const handleInitiateRegistration = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error('Please choose a username for logging in.');
      return;
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmedUsername)) {
      toast.error('Username can only contain letters, numbers, underscores, hyphens, and periods.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter your full name or organization name.');
      return;
    }

    if (!password) {
      toast.error('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please accept the Solar Microgrid Grid Interconnection Terms.');
      return;
    }

    try {
      setSendingOtp(true);
      // Dispatch 6-digit OTP code to the email address
      const res = await authApi.sendOtp(trimmedEmail, role);
      toast.success(res.message || 'Verification passcode dispatched to your email!');

      setStep(2);
      setCooldown(60);
      setAttemptsRemaining(5);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 250);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to dispatch verification code.';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Handle OTP Input Changes
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-complete if 6 digits filled
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
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
      handleCompleteRegistration(pastedData);
    } else {
      toast.error('Pasted passcode must be exactly 6 digits.');
    }
  };

  // Step 2: Verify OTP and Register Account
  const handleCompleteRegistration = async (codeToVerify) => {
    const finalOtp = typeof codeToVerify === 'string' ? codeToVerify : otp.join('');
    if (finalOtp.length !== 6) {
      toast.error('Please enter all 6 digits of your registration code.');
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
        deviceInfo: `Web Portal (${fullName || username})`,
      });

      // Hydrate local authentication session
      loginWithAuthResponse(authResponse);

      // Business Rule: Prosumers require Operator Approval
      if (authResponse.user?.approvalStatus === 'PendingApproval') {
        toast.success(
          'Registration verified! Prosumer accounts require Grid Operator approval before trading energy.',
          { duration: 7000, icon: '⏳' }
        );
      } else {
        toast.success(
          `Welcome to Solar Microgrid, ${authResponse.user?.fullName || authResponse.user?.username || 'Member'}!`,
          { icon: '☀️' }
        );
      }

      navigate('/reservations', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code.';
      toast.error(msg);

      setAttemptsRemaining((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="dashboard-container min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient Radial Lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFD000]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Glassmorphic Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="glass-card max-w-xl w-full p-8 sm:p-10 relative z-10 border border-white/10 shadow-2xl my-8"
      >
        {/* Header with Video and Branding */}
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
                New Participant
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Zero Fees
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Join Solar Microgrid
            </h1>
            <p className="text-xs text-slate-400 tracking-wide">
              Decentralized Renewable Trading &amp; Energy Capacity Dispatch
            </p>
          </div>
        </div>

        {/* Step Transition Animation */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleInitiateRegistration}
              className="space-y-4"
            >
              {/* 1. Operating Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Select Participation Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {REGISTRATION_ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? `${r.borderActive} shadow-lg shadow-black/40`
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon className={`w-4 h-4 ${isSelected ? r.accent : 'text-slate-400'}`} />
                            {isSelected && <CheckCircle2 className={`w-3.5 h-3.5 ${r.accent}`} />}
                          </div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {r.label}
                          </p>
                          <p className="text-[9px] text-slate-500 leading-tight mt-1">
                            {r.description}
                          </p>
                        </div>
                        <div className="mt-2.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${r.badgeColor}`}>
                            {r.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notice for Prosumer role */}
              {role === 'Prosumer' && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>Operator Approval Required:</strong> Prosumers are placed in Pending Approval status upon registration until verified by a Grid Operator.
                  </span>
                </div>
              )}

              {/* 2. Personal Information: Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name / Organization
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sanjitha Ranasinghe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Username (Login Identifier)
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. sanjitha_solar"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Email & NIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address (for OTP Verification)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="prosumer@solarmicrogrid.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    NIC / Prosumer ID
                  </label>
                  <div className="relative">
                    <FileBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. 199812345678"
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Region Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Connected Microgrid Hub
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#15171E] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 transition-all"
                  >
                    {REGIONS.map((reg) => (
                      <option key={reg} value={reg} className="bg-[#15171E] text-white">
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6. Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-white/10 border-white/20 text-[#FFD000] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-400 leading-snug cursor-pointer select-none">
                  I agree to the Microgrid Grid Code interconnection rules, cryptographic dispatch verification, and privacy standards.
                </label>
              </div>

              {/* Continue & Send OTP Button */}
              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full yellow-pill-btn py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-[#FFD000]/20 disabled:opacity-50 mt-4"
              >
                {sendingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Sending Verification Passcode...</span>
                  </>
                ) : (
                  <>
                    <span>Continue &amp; Verify Email</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Account Registration Summary */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD000] px-2 py-0.5 rounded-md bg-[#FFD000]/10 border border-[#FFD000]/20">
                    Verify Email to Complete Registration
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Details
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{fullName || 'Participant'}</p>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {email} &bull; <span className="text-[#FFD000]">@{username}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      Role: <strong className="text-white">{role}</strong>
                    </span>
                    {role === 'Prosumer' && (
                      <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-semibold">
                        Awaiting Operator Approval After Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 6-Digit Passcode Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 text-center">
                  Enter 6-Digit Passcode Sent to Your Email
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
                    Security Token: {attemptsRemaining} attempt(s) remaining.
                  </p>
                )}
              </div>

              {/* Complete Registration Button */}
              <button
                type="button"
                onClick={() => handleCompleteRegistration()}
                disabled={verifying || otp.some((d) => !d)}
                className="w-full yellow-pill-btn py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-[#FFD000]/20 disabled:opacity-40"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying &amp; Creating Account...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-black" />
                    <span>Verify Passcode &amp; Complete Registration</span>
                  </>
                )}
              </button>

              {/* Cooldown & Resend Actions */}
              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  &larr; Back to Details
                </button>

                {cooldown > 0 ? (
                  <span className="text-slate-500 font-medium">
                    Resend code in <strong className="text-slate-300">{cooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleInitiateRegistration(e)}
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

        {/* Link to Login */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
          <p className="text-xs text-slate-400">
            Already have a microgrid account?{' '}
            <Link
              to="/login"
              className="text-[#FFD000] hover:text-yellow-300 font-bold transition-colors ml-1 inline-flex items-center gap-1"
            >
              <span>Sign In with Email or Username</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
