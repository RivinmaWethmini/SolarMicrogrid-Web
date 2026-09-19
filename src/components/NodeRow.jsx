import { motion, AnimatePresence } from 'framer-motion';

// ─── Status Config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Active: {
    label: 'Active',
    dotColor: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    pulse: false,
  },
  Inactive: {
    label: 'Inactive',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    pulse: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCapacity(kwh) {
  if (kwh === null || kwh === undefined) return '—';
  return kwh >= 1000 ? `${(kwh / 1000).toFixed(2)} MW/h` : `${kwh} kW/h`;
}

function formatCoords(lat, lng) {
  if (lat === undefined || lng === undefined) return '—';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Inactive'];
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

// ─── NodeRow ───────────────────────────────────────────────────────────────
/**
 * A single animated table row for a microgrid node.
 *
 * Props:
 *  - node          {object}  The node data object
 *  - onDeactivate  {fn}      Called with node id to deactivate
 *  - onReactivate  {fn}      Called with node id to reactivate
 *  - loadingId     {string}  The id currently being actioned (shows spinner)
 *  - index         {number}  Row index for staggered entrance animation
 */
export default function NodeRow({ node, onDeactivate, onReactivate, loadingId, index }) {
  const {
    id,
    nodeId,
    name,
    latitude,
    longitude,
    capacityKWh,
    batterySlots,
    status,
  } = node;

  const rowId = id ?? nodeId;
  const isLoading = loadingId === rowId;
  const isActive = status === 'Active';

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
      {/* Node ID */}
      <td className="px-5 py-4">
        <span className="font-mono text-xs text-slate-400 tracking-widest group-hover:text-slate-300 transition-colors">
          #{String(rowId).slice(0, 8).toUpperCase()}
        </span>
      </td>

      {/* Name */}
      <td className="px-5 py-4">
        <span className="text-sm font-semibold text-slate-100 tracking-tight leading-snug">
          {name ?? '—'}
        </span>
      </td>

      {/* GPS Location */}
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-wider">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {formatCoords(latitude, longitude)}
        </span>
      </td>

      {/* Capacity */}
      <td className="px-5 py-4">
        <span className="text-sm font-bold text-solar-300 tracking-tight">
          {formatCapacity(capacityKWh)}
        </span>
      </td>

      {/* Battery Slots */}
      <td className="px-5 py-4">
        <span className="text-xs text-slate-300 font-medium tracking-wide">
          {batterySlots ?? '—'} slots
        </span>
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
          ) : isActive ? (
            <motion.button
              key="deactivate"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onDeactivate(rowId)}
              disabled={isLoading}
              className="reject-btn"
              aria-label={`Deactivate node ${rowId}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
              </svg>
              Deactivate
            </motion.button>
          ) : (
            <motion.button
              key="reactivate"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onReactivate(rowId)}
              disabled={isLoading}
              className="approve-btn"
              aria-label={`Reactivate node ${rowId}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Reactivate
            </motion.button>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}