import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import ReservationRow from '../components/ReservationRow';
import emptyStateSvg from '../assets/images/empty-state.svg';
import { RefreshCw } from 'lucide-react';
import bgSolar from '../assets/images/bg-solar.jpg';
import solarGridVideo from '../assets/images/Solar Grid.mp4';

const api = axios.create({
  baseURL: 'http://localhost:5298/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function SkeletonRow({ index }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-white/5"
    >
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 rounded-md bg-gradient-to-r from-white/5 via-white/10 to-white/5"
            style={{
              width: ['80px', '120px', '70px', '90px', '100px', '80px', '130px'][i],
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <motion.div
        initial={{ y: -8 }}
        animate={{ y: 8 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3, ease: 'easeInOut' }}
        className="mb-6 max-w-xs w-60"
      >
        <img
          src={emptyStateSvg}
          alt="No reservations"
          className="w-full h-auto drop-shadow-[0_15px_30px_rgba(245,158,11,0.12)]"
        />
      </motion.div>
      <h3 className="text-xl font-bold text-slate-200 mb-2 tracking-wide">
        {isFiltered ? `No ${filter} Reservations` : 'Grid Queue Empty'}
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto text-sm">
        {isFiltered
          ? `There are currently no reservations with '${filter}' status.`
          : 'All grid nodes are operating optimally. There are no pending operations.'}
      </p>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-3 border border-red-500/20">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-red-300 font-semibold text-sm mb-4">{message}</p>
      <button onClick={onRetry} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-lg border border-white/10 transition-colors">
        Retry Connection
      </button>
    </div>
  );
}

function StatCard({ label, value, gradient, icon, delay }) {
  return (
    <div style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.4, ease: "easeOut" }}
        className={`p-6 pr-10 flex items-center gap-5 ${gradient}`}
        style={{ clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/40 text-slate-900 shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</p>
          <p className="text-[11px] text-slate-900 tracking-widest uppercase mt-1.5 font-bold drop-shadow-sm">{label}</p>
        </div>
      </motion.div>
    </div>
  );
}

function FilterPill({ label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
        active ? 'text-white bg-solar-500 shadow-md shadow-solar-500/20' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
        active ? 'bg-white/20' : 'bg-white/5'
      }`}>
        {count}
      </span>
    </button>
  );
}

const TABLE_HEADERS = ['Reservation ID', 'Prosumer NIC', 'Node ID', 'Capacity (kW)', 'Start Time', 'End Time', 'Status', 'Actions'];

export default function ReservationDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/Reservation');
      const data = response.data.map(item => ({
        id: item.id ?? item.reservationId,
        ...item
      }));
      setReservations(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to reach the grid server.');
      toast.error('Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusUpdate = async (id, status, action) => {
    setLoadingId(id);
    try {
      await api.put(`/Reservation/${id}/${action}`);
      setReservations(prev => prev.map(res =>
        res.id === id ? { ...res, status: status } : res
      ));
      toast.success(`Reservation ${status}`, { icon: status === 'Approved' ? '?' : '?' });
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update status');
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = (id) => handleStatusUpdate(id, 'Approved', 'approve');
  const handleReject = (id) => handleStatusUpdate(id, 'Rejected', 'reject');

  const filtered = reservations.filter(res => {
    const matchesFilter = filter === 'All' || res.status === filter || (!res.status && filter === 'Pending');
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      (res.prosumerId?.toLowerCase().includes(searchTerm)) ||
      (res.nodeId?.toLowerCase().includes(searchTerm)) ||
      (res.id?.toLowerCase().includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  const total = reservations.length;
  const pending = reservations.filter(r => r.status === 'Pending' || !r.status).length;
  const approved = reservations.filter(r => r.status === 'Approved').length;
  const rejected = reservations.filter(r => r.status === 'Rejected').length;

  return (
    <div className="dashboard-container text-white min-h-screen" style={{ backgroundImage: `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.9)), url(${bgSolar})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
      <Toaster position="top-right" toastOptions={{ className: 'font-sans font-semibold text-sm rounded-xl bg-slate-800 text-white border border-slate-700' }} />

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* SKETCH LAYOUT: Grid Operator & Refresh Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4">
  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-lg shadow-black/50">
    <video src={solarGridVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90" />
  </div>
  <h1 className="text-3xl font-bold text-slate-100 tracking-tight leading-none">
    Grid Operator
  </h1>
</div>
          </div>
          
          <button
            onClick={fetchReservations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* SKETCH LAYOUT: 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          <StatCard
            label="Total"
            value={loading ? '-' : total}
            gradient="bg-gradient-to-r from-blue-200 to-blue-400"
            delay={0}
            icon={<svg className="w-5 h-5 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard
            label="Pending"
            value={loading ? '-' : pending}
            gradient="bg-gradient-to-r from-amber-200 to-amber-400"
            delay={0.06}
            icon={<svg className="w-5 h-5 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Approved"
            value={loading ? '-' : approved}
            gradient="bg-gradient-to-r from-emerald-200 to-emerald-400"
            delay={0.12}
            icon={<svg className="w-5 h-5 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Rejected"
            value={loading ? '-' : rejected}
            gradient="bg-gradient-to-r from-red-200 to-rose-400"
            delay={0.18}
            icon={<svg className="w-5 h-5 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* Existing Table Code Intact */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card overflow-hidden bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10"
        >
          <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight leading-none">
                Reservation Queue
              </h2>
              <p className="text-xs text-slate-500 tracking-wide mt-1">
                Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of <span className="text-slate-300 font-semibold">{total}</span> reservations
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search consumer, zone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 tracking-wide w-52 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {['All', 'Pending', 'Approved', 'Rejected'].map((f) => {
                  const counts = { All: total, Pending: pending, Approved: approved, Rejected: rejected };
                  return (
                    <FilterPill
                      key={f}
                      label={f}
                      active={filter === f}
                      count={counts[f]}
                      onClick={() => setFilter(f)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {error ? (
              <ErrorState message={error} onRetry={fetchReservations} />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-xs font-semibold text-slate-400 tracking-widest uppercase"
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
    </div>
  );
}





