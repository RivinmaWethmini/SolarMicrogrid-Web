import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  RefreshCw,
  QrCode,
  X,
  Copy,
  Check,
  AlertCircle,
  Zap,
  ShieldCheck,
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  CircleX,
  TrendingUp,
  Search,
  Network,
  CircleCheck,
} from 'lucide-react';
import api from '../services/api';
import ReservationRow from '../components/ReservationRow';
import emptyStateSvg from '../assets/images/empty-state.svg';
import solarGridVideo from '../assets/images/Solar Grid.mp4';

function SkeletonRow({ index }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-white/5"
    >
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-4 rounded-md bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse"
            style={{ width: ['70px', '110px', '80px', '75px', '90px', '90px', '80px', '110px'][i] }}
          />
        </td>
      ))}
    </motion.tr>
  );
}

function EmptyState({ filter }) {
  const isFiltered = filter !== 'All';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="mb-6 max-w-xs w-48 opacity-85">
        <img
          src={emptyStateSvg}
          alt="No reservations"
          className="w-full h-auto drop-shadow-[0_15px_30px_rgba(255,208,0,0.15)]"
        />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2 tracking-tight">
        {isFiltered ? `No ${filter} Reservations` : 'Grid Dispatch Queue Empty'}
      </h3>
      <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
        {isFiltered
          ? `There are currently no energy slot reservations with '${filter}' status.`
          : 'All microgrid nodes are operating nominally. No active reservation entries in queue.'}
      </p>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-3 border border-red-500/20 shadow-inner">
        <AlertCircle className="w-7 h-7" />
      </div>
      <p className="text-red-300 font-bold text-sm mb-1">{message}</p>
      <p className="text-slate-400 text-xs mb-5">Ensure Central Microgrid API is active on port 5298 and database is connected.</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-full border border-white/15 transition-all shadow-md"
      >
        <RefreshCw className="w-4 h-4" />
        Retry Connection
      </button>
    </div>
  );
}

function StatCard({ label, value, theme, icon, delay, subtitle }) {
  // Theme options: 'yellow', 'cream', 'dark-emerald', 'dark-amber', 'dark-rose'
  let cardClass = '';
  let valueClass = '';
  let labelClass = '';
  let subClass = '';
  let iconClass = '';

  if (theme === 'yellow') {
    cardClass = 'bg-[#FFD000] text-[#0A0A0C] border-none shadow-xl shadow-[#FFD000]/15';
    valueClass = 'text-[#0A0A0C]';
    labelClass = 'text-[#0A0A0C]/80';
    subClass = 'text-[#0A0A0C]/70';
    iconClass = 'bg-black/10 text-[#0A0A0C]';
  } else if (theme === 'cream') {
    cardClass = 'bg-[#F8F7F0] text-[#0A0A0C] border-none shadow-xl shadow-black/30';
    valueClass = 'text-[#0A0A0C]';
    labelClass = 'text-[#0A0A0C]/80';
    subClass = 'text-[#0A0A0C]/70';
    iconClass = 'bg-black/10 text-[#0A0A0C]';
  } else if (theme === 'dark-emerald') {
    cardClass = 'bg-[#121318] text-white border border-emerald-500/30 shadow-lg';
    valueClass = 'text-emerald-400';
    labelClass = 'text-slate-400';
    subClass = 'text-emerald-500/70';
    iconClass = 'bg-emerald-500/10 text-emerald-400';
  } else if (theme === 'dark-amber') {
    cardClass = 'bg-[#121318] text-white border border-[#FFD000]/30 shadow-lg';
    valueClass = 'text-[#FFD000]';
    labelClass = 'text-slate-400';
    subClass = 'text-[#FFD000]/70';
    iconClass = 'bg-[#FFD000]/10 text-[#FFD000]';
  } else {
    // dark-rose
    cardClass = 'bg-[#121318] text-white border border-rose-500/20 shadow-lg';
    valueClass = 'text-rose-400';
    labelClass = 'text-slate-400';
    subClass = 'text-rose-400/70';
    iconClass = 'bg-rose-500/10 text-rose-400';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className={`relative p-5 rounded-3xl transition-all duration-300 ${cardClass}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-3xl font-black tracking-tight leading-none ${valueClass}`}>{value}</p>
          <p className={`text-[11px] tracking-wider uppercase mt-2 font-bold ${labelClass}`}>{label}</p>
          {subtitle && (
            <p className={`text-[10px] font-medium mt-0.5 ${subClass}`}>{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconClass}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function FilterPill({ label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-full text-xs font-bold tracking-normal transition-all duration-200 ${
        active
          ? 'text-[#0A0A0C] bg-[#FFD000] shadow-md shadow-[#FFD000]/25'
          : 'text-slate-400 hover:text-slate-200 bg-white/[0.04] border border-white/5'
      }`}
    >
      {label}
      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-black/15 text-[#0A0A0C]' : 'bg-white/10 text-slate-400'}`}>
        {count}
      </span>
    </button>
  );
}

// ─── QR Code Modal ────────────────────────────────────────────────────────────
function QrModal({ reservation, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!reservation) return null;

  const isApproved = String(reservation.status || '').toLowerCase() === 'approved';
  const payload = reservation.qrPayload || (isApproved ? JSON.stringify({
    type: "SOLAR_MICROGRID_DISPATCH_QR",
    version: "1.0",
    reservationId: reservation.id ?? reservation.reservationId,
    prosumerId: reservation.prosumerNic ?? reservation.prosumerId,
    nodeId: reservation.nodeId,
    reservationDate: reservation.reservationDate,
    status: "Approved",
    issuedAt: new Date().toISOString(),
    securityToken: "APPROVED_DISPATCH"
  }) : null);

  const qrImageUrl = payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`
    : null;

  const handleCopy = () => {
    if (!payload) return;
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('QR payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="bg-[#101116] border border-[#FFD000]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-100"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFD000]/15 text-[#FFD000] flex items-center justify-center border border-[#FFD000]/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">Dispatch QR Pass</h3>
              <p className="text-[11px] text-slate-400">Scan at microgrid station to verify dispatch pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-6 flex flex-col items-center">
          {qrImageUrl ? (
            <>
              <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-[#FFD000]">
                <img src={qrImageUrl} alt="Dispatch QR Pass" className="w-56 h-56 rounded-lg" />
              </div>
              <p className="mt-3.5 text-xs font-mono text-[#FFD000] font-bold tracking-wider">
                #{String(reservation.id ?? reservation.reservationId).slice(-8).toUpperCase()}
              </p>
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-200 font-semibold">
                  {reservation.nodeName || reservation.nodeId || 'Microgrid Solar Node'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {reservation.startTime ? (
                    `${reservation.startTime.replace('T', ' ')}${reservation.endTime ? ` – ${reservation.endTime.replace('T', ' ')}` : ''}`
                  ) : (
                    `Prosumer: ${reservation.prosumerNic ?? reservation.prosumerId}`
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
              <p className="text-red-400 text-sm font-bold">QR Payload Not Available</p>
              <p className="text-slate-400 text-xs mt-1">
                This reservation has not been granted an authentic server dispatch token.
              </p>
            </div>
          )}
        </div>

        {payload && (
          <div className="bg-black/60 rounded-2xl p-3.5 border border-white/10 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Cryptographic Token</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-[#FFD000] hover:text-yellow-300 font-medium transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Payload'}
              </button>
            </div>
            <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto max-h-24 p-2 bg-black/40 rounded-xl">
              {payload}
            </pre>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#FFD000] hover:bg-[#FFE033] text-[#0A0A0C] font-black text-xs tracking-wider uppercase shadow-lg shadow-[#FFD000]/20 transition-all"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const TABLE_HEADERS = [
  'Reservation ID',
  'Prosumer NIC',
  'Node ID',
  'Capacity (kW)',
  'Start Time',
  'End Time',
  'Status',
  'Actions',
];

export default function ReservationDashboard() {
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    approvedFutureReservations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [selectedQrReservation, setSelectedQrReservation] = useState(null);

  const fetchReservationsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [reservationsRes, statsRes] = await Promise.allSettled([
        api.get('/reservations'),
        api.get('/reservations/stats'),
      ]);

      if (reservationsRes.status === 'fulfilled') {
        const data = (reservationsRes.value.data || []).map((item) => ({
          id: item.id ?? item.reservationId,
          ...item,
        }));
        setReservations(data);

        if (statsRes.status !== 'fulfilled') {
          const now = new Date();
          const total = data.length;
          const pending = data.filter((r) => !r.status || r.status === 'Pending').length;
          const approved = data.filter((r) => r.status === 'Approved').length;
          const rejected = data.filter((r) => r.status === 'Rejected').length;
          const cancelled = data.filter((r) => r.status === 'Cancelled').length;
          const approvedFutureReservations = data.filter(
            (r) => r.status === 'Approved' && new Date(r.startTime) > now
          ).length;

          setStats({ total, pending, approved, rejected, cancelled, approvedFutureReservations });
        }
      } else {
        throw reservationsRes.reason;
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to reach the Solar Microgrid API (Port 5298).');
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservationsAndStats();
  }, [fetchReservationsAndStats]);

  const handleStatusUpdate = async (id, status, actionEndpoint) => {
    setLoadingId(id);
    try {
      await api.put(`/reservations/${id}/${actionEndpoint}`);
      toast.success(`Reservation ${status}!`, {
        icon: status === 'Approved'
          ? <CircleCheck className="w-5 h-5 text-emerald-400" />
          : <CircleX className="w-5 h-5 text-red-400" />,
      });
      await fetchReservationsAndStats();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update reservation status';
      console.error('Update error:', err);
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = (id) => handleStatusUpdate(id, 'Approved', 'approve');
  const handleReject = (id) => handleStatusUpdate(id, 'Rejected', 'reject');

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setLoadingId(id);
    try {
      await api.put(`/reservations/${id}/cancel`, { reason: 'Operator cancelled upon request' });
      toast.success('Reservation cancelled successfully');
      await fetchReservationsAndStats();
    } catch (err) {
      const msg = err.response?.data?.message || 'Cancellation failed.';
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = reservations.filter((res) => {
    const resStatus = res.status ?? 'Pending';
    const matchesFilter = filter === 'All' || resStatus.toLowerCase() === filter.toLowerCase();
    const searchTerm = search.toLowerCase();
    const prosumer = (res.prosumerNic ?? res.prosumerId ?? res.consumerId ?? '').toLowerCase();
    const node = (res.nodeId ?? res.microgridNodeId ?? '').toLowerCase();
    const id = String(res.id ?? res.reservationId ?? '').toLowerCase();

    return matchesFilter && (prosumer.includes(searchTerm) || node.includes(searchTerm) || id.includes(searchTerm));
  });

  return (
    <div className="dashboard-container text-white min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans font-semibold text-sm rounded-2xl bg-[#16171E] text-white border border-white/10',
        }}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        {/* Editorial Solar Hero Banner */}
        <div className="relative w-full h-44 overflow-hidden rounded-3xl mb-6 border border-white/10 shadow-2xl">
          <img
            src="/images/reservation_solar_header.jpg"
            alt="Solar microgrid installation"
            className="w-full h-full object-cover"
          />
          {/* Dark gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090C]/95 via-[#08090C]/70 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                  Grid Operator Portal
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Live Operator
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-2 font-medium">
                Smart Solar Microgrid · Energy Slot Reservation &amp; Dispatch Control Center
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar & Connection Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              API Connected (Port 5298)
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Microgrid Dispatch Node Controller
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/nodes"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-[#16171F] hover:bg-[#20222B] text-slate-200 text-xs font-bold transition-all shadow-md"
            >
              <Network className="w-3.5 h-3.5" />
              Solar Nodes
            </Link>
            <Link
              to="/scan"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FFD000] hover:bg-[#FFE033] text-black text-xs font-black transition-all shadow-lg shadow-[#FFD000]/20"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR
            </Link>
            <button
              onClick={fetchReservationsAndStats}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-[#16171F] hover:bg-[#20222B] text-slate-200 text-xs font-bold transition-all disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* 5 Stat Cards — Yellow & Black High Contrast Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
          {/* Card 1: Total Bookings */}
          <StatCard
            label="Total Bookings"
            value={loading ? '…' : stats.total}
            theme="cream"
            delay={0}
            icon={<CalendarDays className="w-5 h-5" />}
          />

          {/* Card 2: Pending Action */}
          <StatCard
            label="Pending Action"
            value={loading ? '…' : stats.pending}
            theme="yellow"
            delay={0.05}
            icon={<CalendarClock className="w-5 h-5 animate-pulse" />}
          />

          {/* Card 3: Approved */}
          <StatCard
            label="Approved"
            value={loading ? '…' : stats.approved}
            theme="dark-emerald"
            delay={0.1}
            icon={<CalendarCheck className="w-5 h-5" />}
          />

          {/* Card 4: Approved Future */}
          <StatCard
            label="Approved Future"
            value={loading ? '…' : stats.approvedFutureReservations}
            theme="dark-amber"
            delay={0.15}
            subtitle="Scheduled ahead"
            icon={<TrendingUp className="w-5 h-5 text-[#FFD000]" />}
          />

          {/* Card 5: Cancelled / Rejected */}
          <StatCard
            label="Cancelled / Rejected"
            value={loading ? '…' : (stats.rejected + stats.cancelled)}
            theme="dark-rose"
            delay={0.2}
            icon={<CircleX className="w-5 h-5" />}
          />
        </div>

        {/* Main Table Container */}
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
                Energy Slot Reservation Queue
              </h2>
              <p className="text-xs text-slate-400 tracking-wide mt-1.5">
                Showing <span className="text-[#FFD000] font-bold">{filtered.length}</span> of <span className="text-white font-bold">{reservations.length}</span> live records
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search NIC, Node, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD000] focus:ring-1 focus:ring-[#FFD000]/40 tracking-wide w-full sm:w-60 transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {['All', 'Pending', 'Approved', 'Cancelled', 'Rejected'].map((f) => {
                  const counts = {
                    All: reservations.length,
                    Pending: stats.pending,
                    Approved: stats.approved,
                    Cancelled: stats.cancelled,
                    Rejected: stats.rejected,
                  };
                  return (
                    <FilterPill
                      key={f}
                      label={f}
                      active={filter === f}
                      count={counts[f] ?? 0}
                      onClick={() => setFilter(f)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {error ? (
              <ErrorState message={error} onRetry={fetchReservationsAndStats} />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => <SkeletonRow key={i} index={i} />)
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filtered.length === 0 ? (
                        <tr key="empty">
                          <td colSpan={8}>
                            <EmptyState filter={filter} />
                          </td>
                        </tr>
                      ) : (
                        filtered.map((reservation, i) => (
                          <ReservationRow
                            key={reservation.id ?? reservation.reservationId ?? i}
                            reservation={reservation}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onCancel={handleCancel}
                            onViewQr={(res) => setSelectedQrReservation(res)}
                            loadingId={loadingId}
                            index={i}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </main>

      {/* QR Code Modal for Approved Bookings */}
      <AnimatePresence>
        {selectedQrReservation && (
          <QrModal
            reservation={selectedQrReservation}
            onClose={() => setSelectedQrReservation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
