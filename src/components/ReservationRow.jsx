import { motion, AnimatePresence } from 'framer-motion';

// ─── Status Config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    dotColor: 'bg-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    pulse: true,
  },
  Approved: {
    label: 'Approved',
    dotColor: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    pulse: false,
  },
  Rejected: {
    label: 'Rejected',
    dotColor: 'bg-red-400',
    badgeClass: 'bg-red-500/15 text-red-300 border border-red-500/30',
    pulse: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPower(kw) {
  if (kw === null || kw === undefined) return '—';
  return kw >= 1000 ? `${(kw / 1000).toFixed(2)} MW` : `${kw} kW`;
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending'];
  return (
    <span className={`status-badge ${cfg.badgeClass}`}>
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dotColor} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dotColor}`} />
      </span>
      {cfg.label}
    </span>
  );
}

// ─── ReservationRow ───────────────────────────────────────────────────────────
/**
 * A single animated table row for a grid reservation.
 *
 * Props:
 *  - reservation  {object}  The reservation data object
 *  - onApprove    {fn}      Called with reservation id to approve
 *  - onReject     {fn}      Called with reservation id to reject
 *  - loadingId    {string}  The id currently being actioned (shows spinner)
 *  - index        {number}  Row index for staggered entrance animation
 */
export default function ReservationRow({ reservation, onApprove, onReject, loadingId, index }) {
  const {
    id,
    reservationId,
    consumerName,
    consumerId,
    requestedPower,
    startDate,
    endDate,
    status,
    gridZone,
    purpose,
  } = reservation;

  const rowId = id ?? reservationId;
  const isLoading = loadingId === rowId;
  const isPending = status === 'Pending';

  const rowVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.97,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  };

  return (
    <motion.tr
      layout
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="group border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-200"
    >
      {/* Reservation ID */}
      <td className="px-5 py-4">
        <span className="font-mono text-xs text-slate-400 tracking-widest group-hover:text-slate-300 transition-colors">
          #{String(rowId).slice(0, 8).toUpperCase()}
        </span>
      </td>

      {/* Consumer */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-slate-100 tracking-tight leading-snug">
            {consumerName ?? '—'}
          </span>
          {consumerId && (
            <span className="text-xs text-slate-500 font-mono tracking-wide">
              ID: {consumerId}
            </span>
          )}
        </div>
      </td>

      {/* Grid Zone */}
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-wider">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {gridZone ?? 'N/A'}
        </span>
      </td>

      {/* Requested Power */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-solar-300 tracking-tight">
            {formatPower(requestedPower)}
          </span>
          {purpose && (
            <span className="text-xs text-slate-500 leading-relaxed truncate max-w-[140px]">
              {purpose}
            </span>
          )}
        </div>
      </td>

      {/* Date Range */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-300 font-medium tracking-wide">
            {formatDate(startDate)}
          </span>
          <span className="text-xs text-slate-500 tracking-wide flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {formatDate(endDate)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusBadge status={status} />
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-slate-400 text-xs tracking-wide"
            >
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </motion.div>
          ) : isPending ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* Approve */}
              <motion.button
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onApprove(rowId)}
                disabled={isLoading}
                className="approve-btn"
                aria-label={`Approve reservation ${rowId}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </motion.button>

              {/* Reject */}
              <motion.button
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onReject(rowId)}
                disabled={isLoading}
                className="reject-btn"
                aria-label={`Reject reservation ${rowId}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </motion.button>
            </motion.div>
          ) : (
            <motion.span
              key="resolved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-slate-500 italic tracking-wide"
            >
              Resolved
            </motion.span>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}
