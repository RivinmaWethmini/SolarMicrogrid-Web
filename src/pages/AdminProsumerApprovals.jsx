import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  Users,
  Sun,
  AlertCircle,
  X,
} from 'lucide-react';
import { authApi } from '../services/api';
import NavigationHeader from '../components/NavigationHeader';

export default function AdminProsumerApprovals() {
  const [prosumers, setProsumers] = useState([]);
  const [stats, setStats] = useState({
    totalProsumers: 0,
    pendingProsumers: 0,
    approvedProsumers: 0,
    rejectedProsumers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending'); // Default view is Pending approvals
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reject modal state
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch prosumers and operational metrics
  const fetchProsumerData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [prosumersRes, statsRes] = await Promise.allSettled([
        authApi.getProsumers(),
        authApi.getAdminStats(),
      ]);

      if (prosumersRes.status === 'fulfilled') {
        const list = prosumersRes.value || [];
        setProsumers(list);

        if (statsRes.status !== 'fulfilled') {
          const pending = list.filter((p) => p.approvalStatus === 'PendingApproval').length;
          const approved = list.filter((p) => p.approvalStatus === 'Approved').length;
          const rejected = list.filter((p) => p.approvalStatus === 'Rejected').length;
          setStats({
            totalProsumers: list.length,
            pendingProsumers: pending,
            approvedProsumers: approved,
            rejectedProsumers: rejected,
          });
        }
      } else {
        throw prosumersRes.reason;
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err) {
      console.error('Failed to load prosumers:', err);
      setError('Unable to load prosumer applications from Central API (Port 5298).');
      toast.error('Failed to retrieve prosumer records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProsumerData();
  }, [fetchProsumerData]);

  // Handle Approve
  const handleApprove = async (prosumerId, email) => {
    try {
      setActionLoadingId(prosumerId);
      const res = await authApi.approveProsumer(prosumerId);
      toast.success(res.message || `Prosumer ${email} approved!`, {
        icon: '✅',
      });
      await fetchProsumerData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve prosumer.';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Modal Submission
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    try {
      setActionLoadingId(rejectingUser.id);
      const res = await authApi.rejectProsumer(rejectingUser.id, rejectReason);
      toast.success(res.message || `Prosumer application rejected.`);
      setRejectingUser(null);
      setRejectReason('');
      await fetchProsumerData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject application.';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtering & search
  const filtered = prosumers.filter((p) => {
    const status = p.approvalStatus || 'Approved';
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Pending' && status === 'PendingApproval') ||
      (filter === 'Approved' && status === 'Approved') ||
      (filter === 'Rejected' && status === 'Rejected');

    const term = search.toLowerCase();
    const name = (p.fullName || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const nic = (p.nic || '').toLowerCase();

    return matchesFilter && (name.includes(term) || email.includes(term) || nic.includes(term));
  });

  return (
    <div className="dashboard-container text-white min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            'font-sans font-semibold text-xs rounded-2xl bg-[#16171E] text-white border border-white/10 shadow-xl',
        }}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD000]/10 border-2 border-[#FFD000]/40 shadow-xl shadow-black/80 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#FFD000]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                  Operator Control Suite
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide mt-1.5">
                Prosumer Grid Interconnection &amp; Energy Authorization Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 rounded-full bg-[#15171E] border border-white/10">
              <Link
                to="/reservations"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-[#FFD000]" />
                <span>Reservations</span>
              </Link>
              <Link
                to="/nodes"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-all"
              >
                <span>Nodes</span>
              </Link>
              <Link
                to="/scan"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-all"
              >
                <span>Verify Pass</span>
              </Link>
              <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold bg-[#FFD000] text-black shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Approvals</span>
                {stats.pendingProsumers > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-black">
                    {stats.pendingProsumers}
                  </span>
                )}
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchProsumerData}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-[#16171F] hover:bg-[#20222B] text-slate-200 text-xs font-bold transition-all disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 text-xs font-bold transition-all shadow-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          {/* Card 1: Pending Approvals (Electric Yellow Highlight Card) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-[#FFD000] text-[#0A0A0C] shadow-xl shadow-[#FFD000]/15 relative hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black tracking-tight leading-none text-[#0A0A0C]">
                  {loading ? '…' : stats.pendingProsumers}
                </p>
                <p className="text-[11px] tracking-wider uppercase mt-2 font-bold text-[#0A0A0C]/80">
                  Pending Verification
                </p>
                <p className="text-[10px] font-medium text-[#0A0A0C]/70 mt-0.5">
                  Action required
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center text-[#0A0A0C]">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Approved Prosumers (Dark Obsidian Emerald) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-3xl bg-[#121318] border border-emerald-500/30 text-white shadow-lg relative hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black tracking-tight leading-none text-emerald-400">
                  {loading ? '…' : stats.approvedProsumers}
                </p>
                <p className="text-[11px] tracking-wider uppercase mt-2 font-bold text-slate-400">
                  Active Prosumers
                </p>
                <p className="text-[10px] font-medium text-emerald-500/70 mt-0.5">
                  Trading enabled
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sun className="w-6 h-6" />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Rejected / Declined (Dark Obsidian Rose) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-3xl bg-[#121318] border border-rose-500/20 text-white shadow-lg relative hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black tracking-tight leading-none text-rose-400">
                  {loading ? '…' : stats.rejectedProsumers}
                </p>
                <p className="text-[11px] tracking-wider uppercase mt-2 font-bold text-slate-400">
                  Declined / Revoked
                </p>
                <p className="text-[10px] font-medium text-rose-400/70 mt-0.5">
                  Access restricted
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Total Prosumers (Cream High Contrast) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-3xl bg-[#F8F7F0] text-[#0A0A0C] shadow-xl relative hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black tracking-tight leading-none text-[#0A0A0C]">
                  {loading ? '…' : stats.totalProsumers}
                </p>
                <p className="text-[11px] tracking-wider uppercase mt-2 font-bold text-[#0A0A0C]/80">
                  Total Registrations
                </p>
                <p className="text-[10px] font-medium text-[#0A0A0C]/70 mt-0.5">
                  Producer network
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-black/10 text-[#0A0A0C] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Application Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card overflow-hidden rounded-3xl"
        >
          {/* Controls Bar */}
          <div className="px-6 sm:px-8 py-6 border-b border-white/[0.06] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-none">
                Prosumer Interconnection Applications
              </h2>
              <p className="text-xs text-slate-400 tracking-wide mt-1.5">
                Showing <span className="text-[#FFD000] font-bold">{filtered.length}</span> of{' '}
                <span className="text-white font-bold">{prosumers.length}</span> registered prosumers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Name, Email, NIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 tracking-wide w-full sm:w-64 transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[
                  { id: 'Pending', label: 'Pending', count: stats.pendingProsumers },
                  { id: 'Approved', label: 'Approved', count: stats.approvedProsumers },
                  { id: 'Rejected', label: 'Rejected', count: stats.rejectedProsumers },
                  { id: 'All', label: 'All', count: stats.totalProsumers },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      filter === tab.id
                        ? 'bg-[#FFD000] text-black shadow-md shadow-[#FFD000]/25'
                        : 'bg-white/[0.04] border border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px] font-black">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {error ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-300 font-bold text-sm mb-3">{error}</p>
                <button
                  onClick={fetchProsumerData}
                  className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 tracking-wider uppercase">
                      Applicant
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 tracking-wider uppercase">
                      Prosumer NIC / ID
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 tracking-wider uppercase">
                      Registered On
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 tracking-wider uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 tracking-wider uppercase text-right">
                      Verification Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b border-white/5 animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-36 bg-white/10 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-white/10 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-white/10 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-white/10 rounded" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-7 w-28 bg-white/10 rounded-full ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <img
                          src={emptyStateSvg}
                          alt="No prosumers"
                          className="w-40 mx-auto mb-4 opacity-80"
                        />
                        <h3 className="text-lg font-bold text-white mb-1">
                          No {filter !== 'All' ? `${filter} ` : ''}Prosumer Applications
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {filter === 'Pending'
                            ? 'All caught up! There are zero prosumer verification requests awaiting approval.'
                            : 'No records found matching the active filter criteria.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filtered.map((p, idx) => {
                        const status = p.approvalStatus || 'Approved';
                        const isPending = status === 'PendingApproval';
                        const isApproved = status === 'Approved';
                        const isRejected = status === 'Rejected';
                        const isLoadingThis = actionLoadingId === p.id;

                        return (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                          >
                            {/* 1. Applicant Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0">
                                  {p.fullName ? p.fullName[0].toUpperCase() : p.email[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white tracking-tight leading-snug truncate">
                                    {p.fullName || 'Registered Participant'}
                                  </p>
                                  <p className="text-xs text-slate-400 font-mono truncate">{p.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* 2. NIC */}
                            <td className="px-6 py-4">
                              {p.nic ? (
                                <span className="font-mono text-xs font-bold text-[#FFD000] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                                  {p.nic}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Not provided</span>
                              )}
                            </td>

                            {/* 3. Registered Date */}
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-300">
                                {new Date(p.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </td>

                            {/* 4. Status Badge */}
                            <td className="px-6 py-4">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD000] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD000]" />
                                  </span>
                                  Pending Verification
                                </span>
                              ) : isApproved ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle className="w-3 h-3" />
                                  Approved &amp; Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  <XCircle className="w-3 h-3" />
                                  Declined
                                </span>
                              )}
                            </td>

                            {/* 5. Actions */}
                            <td className="px-6 py-4 text-right">
                              {isLoadingThis ? (
                                <span className="text-xs text-slate-400 flex items-center justify-end gap-1.5">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFD000]" />
                                  Updating...
                                </span>
                              ) : isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApprove(p.id, p.email)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-emerald-500/20"
                                    title="Approve prosumer and unlock grid trading"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingUser(p);
                                      setRejectReason('');
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                    title="Decline prosumer interconnection request"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : isApproved ? (
                                <button
                                  onClick={() => {
                                    setRejectingUser(p);
                                    setRejectReason('Operator revoked grid trading authorization.');
                                  }}
                                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 text-[11px] font-medium transition-all"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApprove(p.id, p.email)}
                                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-white/10 text-[11px] font-medium transition-all"
                                >
                                  Re-Approve
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </main>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {rejectingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-[#101116] border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center border border-red-500/30">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Decline Prosumer</h3>
                    <p className="text-[11px] text-slate-400">Reject grid interconnection request</p>
                  </div>
                </div>
                <button
                  onClick={() => setRejectingUser(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-5 space-y-4">
                <p className="text-xs text-slate-300">
                  Are you sure you want to decline authorization for{' '}
                  <strong className="text-white">{rejectingUser.fullName || rejectingUser.email}</strong>?
                </p>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Decline Reason (Visible to Applicant)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Solar inverter specs do not match Western Grid frequency standards."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRejectingUser(null)}
                  className="flex-1 dark-pill-btn py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === rejectingUser.id}
                  className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoadingId === rejectingUser.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Decline</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
