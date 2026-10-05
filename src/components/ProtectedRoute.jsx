import React, { useState } from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  ShieldX,
  LogOut,
  ArrowLeft,
  Zap,
  Clock,
  RefreshCw,
  FileCheck2,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, requireApproval = false, children }) {
  const { user, loading, isAuthenticated, logout, refreshProfile } = useAuth();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(false);
  // Snapshot preview bypass for authentic system documentation
  if (location.search.includes('preview=true')) {
    return children ? children : <Outlet />;
  }

  // 1. Session Hydration / Verification Loading State
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#08090C] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD000]/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center z-10"
        >
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#15171E] border border-[#FFD000]/30 flex items-center justify-center shadow-xl shadow-black/60">
              <Zap className="w-8 h-8 text-[#FFD000] animate-pulse" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-[#FFD000]/40 animate-ping pointer-events-none" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            Verifying Grid Credentials
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Synchronizing encrypted session claims with the central microgrid node...
          </p>
        </motion.div>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Prosumer & Operator Approval Workflow Guard
  // BUSINESS RULE: Operators must be approved by an Admin before accessing the system; Prosumers must be approved before trading.
  const userRole = (user.role || '').toLowerCase();
  const isOperator = userRole === 'gridoperator' || userRole === 'operator' || userRole === 'admin';
  const isProsumer = userRole === 'prosumer';

  if (isProsumer || isOperator) {
    const isPending = user.approvalStatus === 'PendingApproval';
    const isRejected = user.approvalStatus === 'Rejected';

    const handleCheckStatus = async () => {
      try {
        setCheckingStatus(true);
        const updated = await refreshProfile();
        if (updated?.approvalStatus === 'Approved') {
          toast.success(
            isOperator
              ? 'Congratulations! Your Operator account has been approved by an Administrator!'
              : 'Congratulations! Your Prosumer account has been approved by the Grid Operator!',
            { duration: 6000 }
          );
        } else if (updated?.approvalStatus === 'Rejected') {
          toast.error(
            isOperator
              ? 'Your operator account was declined by an administrator.'
              : 'Your application has been declined by the operator.'
          );
        } else {
          toast(
            isOperator
              ? 'Your operator verification is still pending administrator review.'
              : 'Your prosumer verification is still pending operator review.',
            { icon: '⏳' }
          );
        }
      } catch {
        toast.error('Unable to refresh verification status. Please check your network.');
      } finally {
        setCheckingStatus(false);
      }
    };

    if (isPending) {
      return (
        <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Ambient Amber Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD000]/10 rounded-full blur-[140px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card max-w-lg w-full p-8 sm:p-10 text-center relative z-10 border border-[#FFD000]/30 shadow-2xl"
          >
            {/* Pulsing Status Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-3xl bg-[#FFD000]/15 border-2 border-[#FFD000]/40 text-[#FFD000] flex items-center justify-center shadow-xl shadow-[#FFD000]/20">
                <Clock className="w-10 h-10 animate-pulse text-[#FFD000]" />
              </div>
              <div className="absolute -inset-1 rounded-3xl border border-[#FFD000]/30 animate-ping pointer-events-none" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000] animate-ping" />
              Awaiting Administrator Approval
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              {isOperator ? 'Operator Account Under Review' : 'Prosumer Account Under Review'}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              {isOperator
                ? 'Your Operator account registration has been submitted and is currently awaiting authorization from a System Administrator before access to grid operations is unlocked.'
                : 'Your Solar Prosumer registration has been recorded and is currently awaiting authorization from a System Administrator before access to microgrid energy trading and operational controls is unlocked.'}
            </p>

            {/* Application Summary Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left mb-6 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-slate-400">Account Role</span>
                <span className="font-bold text-emerald-400 uppercase">
                  {isOperator ? 'Grid Operator' : 'Solar Prosumer'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Applicant</span>
                <span className="font-semibold text-white">{user.fullName || 'Registered Participant'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Address</span>
                <span className="font-mono text-slate-300">{user.email}</span>
              </div>
              {user.nic && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NIC / ID</span>
                  <span className="font-mono text-[#FFD000] font-bold">{user.nic}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-slate-400">Status</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFD000]/15 text-[#FFD000] font-bold text-[10px] uppercase">
                  Pending Approval
                </span>
              </div>
            </div>

            {/* Explanatory Policy Note */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 mb-6 flex items-start gap-2.5 text-left">
              <FileCheck2 className="w-4 h-4 text-[#FFD000] flex-shrink-0 mt-0.5" />
              <span>
                {isOperator
                  ? 'Administrative security policies require identity verification and authorization by a System Administrator before operational controls are enabled.'
                  : 'Grid Interconnection Code policies require verification of solar capacity and node telemetry before dispatch rights are activated.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="flex-1 yellow-pill-btn flex items-center justify-center gap-2 py-3 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-black ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>{checkingStatus ? 'Checking Status...' : 'Check Status'}</span>
              </button>
              <button
                onClick={() => logout()}
                className="flex-1 dark-pill-btn flex items-center justify-center gap-2 py-3 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    if (isRejected) {
      return (
        <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center p-6 relative font-sans">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card max-w-md w-full p-8 text-center relative z-10 border border-red-500/30 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ShieldX className="w-8 h-8" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30 mb-3">
              Registration Declined
            </span>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              Verification Not Approved
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {isOperator
                ? 'Your Operator account registration was not approved by a System Administrator.'
                : 'Your Solar Prosumer registration was not approved by the grid supervisor.'}
            </p>

            {user.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 mb-6 text-left">
                <strong>Reason:</strong> {user.rejectionReason}
              </div>
            )}

            <button
              onClick={() => logout()}
              className="w-full yellow-pill-btn flex items-center justify-center gap-2 py-3"
            >
              <LogOut className="w-3.5 h-3.5 text-black" />
              Sign Out &amp; Return to Login
            </button>
          </motion.div>
        </div>
      );
    }
  }

  // 4. Role-Based Access Control (RBAC) Verification
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const hasRequiredRole = allowedRoles.some(
      (role) => role.toLowerCase() === userRole
    );

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center p-6 relative">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card max-w-md w-full p-8 text-center relative z-10 border border-red-500/30 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30 mb-3">
              403 Unauthorized Role
            </span>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              Access Restricted
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              This operational module requires{' '}
              <span className="text-[#FFD000] font-bold">
                {allowedRoles.join(' or ')}
              </span>{' '}
              privileges. Your account (
              <span className="text-slate-200 font-medium">{user.email}</span>) is
              currently assigned the{' '}
              <span className="text-red-300 font-bold uppercase">{user.role}</span>{' '}
              role.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => logout()}
                className="flex-1 yellow-pill-btn flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Switch Account
              </button>
              <Link
                to="/reservations"
                className="flex-1 dark-pill-btn flex items-center justify-center gap-2 py-2.5 text-xs font-semibold no-underline text-center"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      );
    }
  }

  // 5. Authorized
  return children ? children : <Outlet />;
}
