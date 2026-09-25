import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Zap, CircleCheck, CircleX, Ban, LoaderCircle, XCircle, Clock } from 'lucide-react';

// ─── Status Config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    dotColor: 'bg-[#FFD000]',
    badgeClass: 'bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30',
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
  Cancelled: {
    label: 'Cancelled',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    pulse: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-200 font-medium">
        {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
      <span className="text-[11px] text-slate-400 font-mono">
        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

function formatPower(kw) {
  if (kw === null || kw === undefined || isNaN(kw)) return '0 kW';
  const num = Number(kw);
  return num >= 1000 ? `${(num / 1000).toFixed(2)} MW` : `${num.toFixed(1)} kW`;
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}>
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
export default function ReservationRow({
  reservation,
  onApprove,
  onReject,
  onCancel,
  onViewQr,
  loadingId,
  index,
  userRole,
}) {
  const rowId = reservation.id ?? reservation.reservationId ?? '';
  const prosumerNic = reservation.prosumerNic ?? reservation.prosumerId ?? reservation.consumerId ?? '—';
  const consumerName = reservation.consumerName;
  const nodeId = reservation.nodeId ?? reservation.microgridNodeId ?? reservation.gridZone ?? 'N/A';
  const nodeName = reservation.nodeName;
  const power = reservation.reservedEnergyKwh ?? reservation.requestedPower ?? 0;
  const totalPrice = reservation.totalPrice;
  const startTime = reservation.startTime ?? reservation.startDate;
  const endTime = reservation.endTime ?? reservation.endDate;
  const status = reservation.status ?? 'Pending';

  const isLoading = loadingId === rowId;
  const isPending = status === 'Pending';
  const isApproved = status === 'Approved';
  const isCancelled = status === 'Cancelled';
  const isRejected = status === 'Rejected';
  const isAdmin = userRole?.toLowerCase() === 'admin';

  const rowVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.99 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: index * 0.03,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.98,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  };

  return (
    <motion.tr
      layout
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="group border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors duration-200"
    >
      {/* 1. Reservation ID */}
      <td className="px-6 py-4">
        <span className="font-mono text-xs text-[#FFD000] font-bold tracking-wider group-hover:text-yellow-300 transition-colors">
          #{String(rowId).slice(-6).toUpperCase()}
        </span>
      </td>

      {/* 2. Prosumer NIC / Identifier */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-slate-100 tracking-tight leading-snug">
            {prosumerNic}
          </span>
          {consumerName && (
            <span className="text-xs text-slate-400 tracking-wide">
              {consumerName}
            </span>
          )}
        </div>
      </td>

      {/* 3. Microgrid Node ID */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold tracking-wide">
          <Zap className="w-3 h-3 text-[#FFD000]" />
          {nodeName ? `${nodeName} (${String(nodeId).slice(-4)})` : String(nodeId).slice(-8).toUpperCase()}
        </span>
      </td>

      {/* 4. Capacity (kW/h) & Price */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-[#FFD000] tracking-tight">
            {formatPower(power)}
          </span>
          {totalPrice > 0 && (
            <span className="text-xs text-emerald-400 font-mono">
              LKR {Number(totalPrice).toFixed(2)}
            </span>
          )}
        </div>
      </td>

      {/* 5. Start Time */}
      <td className="px-6 py-4">
        {formatDateTime(startTime)}
      </td>

      {/* 6. End Time */}
      <td className="px-6 py-4">
        {formatDateTime(endTime)}
      </td>

      {/* 7. Status */}
      <td className="px-6 py-4">
        <StatusBadge status={status} />
      </td>

      {/* 8. Actions (Approval, Rejection, QR Inspection, Cancellation) */}
      <td className="px-6 py-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-slate-400 text-xs tracking-wide"
            >
              <LoaderCircle className="w-4 h-4 animate-spin text-[#FFD000]" />
              Updating…
            </motion.div>
          ) : isPending ? (
            isAdmin ? (
              <motion.div
                key="pending-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                {/* Approve Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onApprove(rowId)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Approve energy slot reservation and dispatch QR"
                >
                  <CircleCheck className="w-3.5 h-3.5" />
                  Approve
                </motion.button>

                {/* Reject Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onReject(rowId)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Reject reservation request"
                >
                  <CircleX className="w-3.5 h-3.5" />
                  Reject
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="non-admin-pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFD000]/10 text-[#FFD000] border border-[#FFD000]/25 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-pulse text-[#FFD000]" />
                  Awaiting Operator Approval
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCancel(rowId)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/10 text-xs font-medium flex items-center gap-1 transition-all"
                  title="Withdraw / Cancel pending booking"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </motion.button>
              </motion.div>
            )
          ) : isApproved ? (
            <motion.div
              key="approved-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* View QR Button (Yellow Accent) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewQr(reservation)}
                className="px-3 py-1.5 rounded-xl bg-[#FFD000]/15 hover:bg-[#FFD000]/25 text-[#FFD000] border border-[#FFD000]/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="View generated Dispatch QR Code pass"
              >
                <QrCode className="w-3.5 h-3.5 text-[#FFD000]" />
                View Pass
              </motion.button>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCancel(rowId)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Cancel reservation"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel
              </motion.button>
            </motion.div>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 italic tracking-wide">
              <Ban className="w-3 h-3" />
              Cancelled
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-400/80 italic tracking-wide">
              <CircleX className="w-3 h-3" />
              Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 italic tracking-wide">
              <CircleCheck className="w-3 h-3" />
              Resolved
            </span>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}
