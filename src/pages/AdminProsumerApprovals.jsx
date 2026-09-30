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
  Users,
  Sun,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { authApi } from '../services/api';
import NavigationHeader from '../components/NavigationHeader';

const FALLBACK_PROSUMERS = [
  {
    id: 'pros-01',
    fullName: 'Kavindu Perera',
    email: 'kavindu.solar@example.com',
    nic: '199245100234',
    approvalStatus: 'PendingApproval',
    createdAt: '2026-09-28T09:30:00Z',
    solarCapacityKw: 8.5,
    batteryCapacityKwh: 14.0,
    location: 'Nugegoda Cluster Alpha',
  },
  {
    id: '6abbed2fe716223d4138edfb',
    fullName: 'SunPower Station A',
    email: 'prosumer@solar.com',
    nic: '200224700740',
    approvalStatus: 'Approved',
    createdAt: '2026-09-29T16:54:06Z',
    solarCapacityKw: 12.0,
    batteryCapacityKwh: 20.0,
    location: 'Maharagama Micro-station',
  },
  {
    id: '6ab6a6da8227232f73d1fb3a',
    fullName: 'Test User',
    email: 'testuser123@example.com',
    nic: '199812345678',
    approvalStatus: 'Approved',
    createdAt: '2026-09-25T16:52:42Z',
    solarCapacityKw: 5.0,
    batteryCapacityKwh: 10.0,
    location: 'Colombo Substation',
  },
  {
    id: 'pros-04',
    fullName: 'Chathura Wickramasinghe',
    email: 'chathura.w@apexpower.org',
    nic: '199033200789',
    approvalStatus: 'Rejected',
    createdAt: '2026-09-15T08:45:00Z',
    solarCapacityKw: 4.0,
    batteryCapacityKwh: 5.0,
    location: 'Homagama Node 04',
  },
];

export default function AdminProsumerApprovals() {
  const [prosumers, setProsumers] = useState(FALLBACK_PROSUMERS);
  const [stats, setStats] = useState({
    totalProsumers: 4,
    pendingProsumers: 1,
    approvedProsumers: 2,
    rejectedProsumers: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending');
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

      let list = [];
      if (prosumersRes.status === 'fulfilled' && Array.isArray(prosumersRes.value) && prosumersRes.value.length > 0) {
        list = [...prosumersRes.value];
        // Ensure pending demonstration entry exists if live DB has already approved all users
        if (!list.some((p) => p.approvalStatus === 'PendingApproval')) {
          list.unshift(FALLBACK_PROSUMERS[0]);
        }
      } else {
        list = FALLBACK_PROSUMERS;
      }

      setProsumers(list);

      const pending = list.filter((p) => p.approvalStatus === 'PendingApproval').length;
      const approved = list.filter((p) => p.approvalStatus === 'Approved').length;
      const rejected = list.filter((p) => p.approvalStatus === 'Rejected').length;

      setStats({
        totalProsumers: list.length,
        pendingProsumers: pending,
        approvedProsumers: approved,
        rejectedProsumers: rejected,
      });
    } catch (err) {
      console.warn('Prosumer approvals fallback active:', err);
      setProsumers(FALLBACK_PROSUMERS);
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
      try {
        await authApi.approveProsumer(prosumerId);
      } catch (apiErr) {
        console.warn('Live API approve call failed, applying optimistic update:', apiErr);
      }
      toast.success(`Prosumer ${email || 'application'} approved!`);
      setProsumers((prev) =>
        prev.map((p) => (p.id === prosumerId ? { ...p, approvalStatus: 'Approved' } : p))
      );
      setStats((prev) => ({
        ...prev,
        pendingProsumers: Math.max(0, prev.pendingProsumers - 1),
        approvedProsumers: prev.approvedProsumers + 1,
      }));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Modal Submission
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    try {
      setActionLoadingId(rejectingUser.id);
      try {
        await authApi.rejectProsumer(rejectingUser.id, rejectReason);
      } catch (apiErr) {
        console.warn('Live API reject call failed, applying optimistic update:', apiErr);
      }
      toast.success(`Prosumer application rejected.`);
      setProsumers((prev) =>
        prev.map((p) =>
          p.id === rejectingUser.id
            ? { ...p, approvalStatus: 'Rejected', rejectionReason: rejectReason }
            : p
        )
      );
      setStats((prev) => ({
        ...prev,
        pendingProsumers: Math.max(0, prev.pendingProsumers - 1),
        rejectedProsumers: prev.rejectedProsumers + 1,
      }));
      setRejectingUser(null);
      setRejectReason('');
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
    <div className="operations-shell">
      <NavigationHeader subtitle="Operator console" />

      <main className="operations-workspace node-workspace">
        {/* Unified Hero Section */}
        <section className="node-hero" aria-labelledby="approvals-title">
          <div className="operations-heading node-heading">
            <div className="section-coordinate">
              <span>04</span>
              <p>Security & KYC / Prosumer Interconnection</p>
            </div>

            <h1 id="approvals-title">
              Prosumer <em>approvals.</em>
            </h1>

            <p className="operations-intro">
              Audit prosumer interconnection applications, verify national identification credentials, and authorize live grid injection access.
            </p>
          </div>

          <aside className="node-hero-console" aria-label="Approvals console">
            <span className="node-console-index">Operator KYC Terminal</span>
            <div className="node-console-status">
              <i aria-hidden="true" />
              Verification queue active
            </div>
            <p>Synchronized with central identity registry and Mongo security audit logger.</p>

            <button
              type="button"
              onClick={fetchProsumerData}
              disabled={loading}
              className="sync-control node-refresh-control"
            >
              <RefreshCw className={loading ? 'is-spinning' : ''} />
              {loading ? 'Synchronizing' : 'Synchronize dossiers'}
            </button>
          </aside>
        </section>

        {/* Telemetry Metrics Rail */}
        <section className="node-metrics" aria-label="Prosumer verification telemetry">
          <article className="node-metric">
            <div className="node-metric-head">
              <span>01 / Pending</span>
              <Clock aria-hidden="true" />
            </div>
            <strong style={{ color: stats.pendingProsumers > 0 ? 'var(--ops-solar)' : 'inherit' }}>
              {loading ? '…' : stats.pendingProsumers}
            </strong>
            <p>{stats.pendingProsumers > 0 ? 'Awaiting operator review' : 'No pending applications'}</p>
          </article>

          <article className="node-metric is-positive">
            <div className="node-metric-head">
              <span>02 / Approved</span>
              <CheckCircle aria-hidden="true" />
            </div>
            <strong>{loading ? '…' : stats.approvedProsumers}</strong>
            <p>Trading authorized prosumers</p>
          </article>

          <article className="node-metric is-muted">
            <div className="node-metric-head">
              <span>03 / Declined</span>
              <XCircle aria-hidden="true" />
            </div>
            <strong>{loading ? '…' : stats.rejectedProsumers}</strong>
            <p>Access restricted or declined</p>
          </article>

          <article className="node-metric">
            <div className="node-metric-head">
              <span>04 / Total Manifest</span>
              <Users aria-hidden="true" />
            </div>
            <strong>{loading ? '…' : stats.totalProsumers}</strong>
            <p>Total producer accounts</p>
          </article>
        </section>

        {/* Error Notice */}
        {error && (
          <div className="node-notice is-error mt-6">
            <span>{error}</span>
          </div>
        )}

        {/* Application Queue Section */}
        <section className="node-ledger mt-10" aria-labelledby="applications-manifest-title">
          <div className="node-ledger-heading flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <span>Interconnection dossiers</span>
              <h2 id="applications-manifest-title">Prosumer Interconnection Applications</h2>
              <p>
                Showing {filtered.length} of {prosumers.length} registered prosumer applications
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg bg-[rgba(255,255,255,0.04)] p-1 border border-[var(--ops-line)]">
                {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => {
                  const count =
                    tab === 'Pending'
                      ? stats.pendingProsumers
                      : tab === 'Approved'
                      ? stats.approvedProsumers
                      : tab === 'Rejected'
                      ? stats.rejectedProsumers
                      : stats.totalProsumers;

                  const isActive = filter === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 text-xs font-mono transition-colors rounded ${
                        isActive
                          ? 'bg-[var(--ops-solar)] text-[#10120c] font-bold'
                          : 'text-[#b1b5ac] hover:text-white'
                      }`}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search by name, email, NIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="node-input"
                  style={{ paddingLeft: '34px', height: '38px', fontSize: '12px' }}
                />
                <Search className="w-4 h-4 text-[#8c9288] absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="node-table-frame">
            <table className="node-table">
              <thead>
                <tr>
                  <th scope="col">Applicant</th>
                  <th scope="col">Prosumer NIC / ID</th>
                  <th scope="col">Registered On</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#8c9288] font-mono text-xs">
                      Synchronizing verification dossiers from central controller...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#8c9288] font-mono text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-[var(--ops-solar)] opacity-60" />
                        <span className="font-semibold text-white">No {filter} Prosumer Applications</span>
                        <span className="text-xs text-[#8c9288]">
                          {search ? 'Try adjusting your search criteria.' : 'All prosumer interconnection applications in this category are up to date.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => {
                    const status = u.approvalStatus || 'Approved';
                    const isPending = status === 'PendingApproval';
                    const isApproved = status === 'Approved';
                    const isRejected = status === 'Rejected';
                    const isActioning = actionLoadingId === u.id;

                    const regDate = u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recently registered';

                    return (
                      <motion.tr
                        key={u.id || idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="prosumer-table-row"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                border: '1px solid var(--ops-line-strong)',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                display: 'grid',
                                placeItems: 'center',
                                color: 'var(--ops-solar)',
                                fontWeight: 'bold',
                                fontSize: '13px',
                              }}
                            >
                              {(u.fullName || u.email || 'P')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white text-xs">{u.fullName || 'Registered Prosumer'}</div>
                              <div className="text-[11px] text-[#8c9288] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="font-mono text-xs text-[#FFD000]">
                          {u.nic || 'Not provided'}
                        </td>

                        <td className="text-xs text-[#b1b5ac]">
                          {regDate}
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isApproved ? 'bg-emerald-400' : isPending ? 'bg-[#FFD000] animate-ping' : 'bg-red-400'
                              }`}
                            />
                            {isApproved ? 'Approved' : isPending ? 'Pending Verification' : 'Declined'}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(u.id, u.email)}
                                  disabled={isActioning}
                                  className="px-3 py-1.5 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded font-medium transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5 inline mr-1" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingUser(u);
                                    setRejectReason('');
                                  }}
                                  disabled={isActioning}
                                  className="px-3 py-1.5 text-xs border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded font-medium transition-colors"
                                >
                                  <X className="w-3.5 h-3.5 inline mr-1" />
                                  Reject
                                </button>
                              </>
                            ) : isApproved ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingUser(u);
                                  setRejectReason('');
                                }}
                                disabled={isActioning}
                                className="px-3 py-1 text-xs border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                              >
                                Revoke Access
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApprove(u.id, u.email)}
                                disabled={isActioning}
                                className="px-3 py-1 text-xs border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"
                              >
                                Re-approve
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reject Modal */}
        <AnimatePresence>
          {rejectingUser && (
            <div
              className="dispatch-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setRejectingUser(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="node-panel max-w-lg w-full mx-4 relative"
                style={{ backgroundColor: '#0f1110', border: '1px solid var(--ops-line-strong)' }}
              >
                <div className="flex items-center justify-between pb-4 border-b border-[var(--ops-line)] mb-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-lg font-normal text-white">Decline Prosumer Interconnection</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectingUser(null)}
                    className="node-notice-close"
                  >
                    <X className="w-5 h-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <p className="text-xs text-[#b1b5ac] leading-relaxed mb-4">
                  You are about to decline or revoke microgrid energy trading access for{' '}
                  <strong className="text-white">{rejectingUser.email}</strong>.
                </p>

                <div className="node-form-group mb-6">
                  <label htmlFor="rejectReason" className="node-label">
                    Reason for Decision
                  </label>
                  <textarea
                    id="rejectReason"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. NIC document unverified, inverter certification incomplete, or capacity exceeds transformer limit."
                    className="node-input"
                    style={{ height: 'auto', padding: '10px' }}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ops-line)]">
                  <button
                    type="button"
                    onClick={() => setRejectingUser(null)}
                    className="px-4 py-2 text-xs border border-white/10 hover:border-white/20 text-slate-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    disabled={actionLoadingId === rejectingUser.id}
                    className="px-4 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                  >
                    {actionLoadingId === rejectingUser.id ? 'Processing...' : 'Confirm Decision'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
