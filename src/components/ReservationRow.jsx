import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ban,
  Check,
  CircleX,
  Clock,
  LoaderCircle,
  QrCode,
  XCircle,
  Zap,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending review', className: 'is-pending' },
  approved: { label: 'Approved', className: 'is-approved' },
  rejected: { label: 'Rejected', className: 'is-rejected' },
  cancelled: { label: 'Cancelled', className: 'is-cancelled' },
};

function normalizeStatus(status) {
  const key = String(status || 'Pending').toLowerCase();
  return STATUS_CONFIG[key] ? key : 'pending';
}

function shortReference(value, length = 7) {
  if (value === null || value === undefined || value === '') return 'PENDING';
  return String(value).slice(-length).toUpperCase();
}

function formatDateTime(dateString) {
  if (!dateString) return <span className="ledger-missing-value">Not set</span>;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return <span className="ledger-missing-value">Not set</span>;

  return (
    <div className="ledger-datetime">
      <span>{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      <small>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
    </div>
  );
}

function formatEnergy(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0.0 kWh';

  const energy = Number(value);
  return energy >= 1000
    ? (energy / 1000).toFixed(2) + ' MWh'
    : energy.toFixed(1) + ' kWh';
}

function StatusMark({ status }) {
  const key = normalizeStatus(status);
  const config = STATUS_CONFIG[key];

  return (
    <span className={'ledger-status ' + config.className}>
      <i aria-hidden="true" />
      {config.label}
    </span>
  );
}

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
  const prosumerNic = reservation.prosumerNic
    ?? reservation.prosumerId
    ?? reservation.consumerId
    ?? 'Not assigned';
  const consumerName = reservation.consumerName;
  const nodeId = reservation.nodeId
    ?? reservation.microgridNodeId
    ?? reservation.gridZone
    ?? 'Not assigned';
  const nodeName = reservation.nodeName;
  const energy = reservation.reservedEnergyKwh ?? reservation.requestedPower ?? 0;
  const totalPrice = Number(reservation.totalPrice) || 0;
  const startTime = reservation.startTime ?? reservation.startDate;
  const endTime = reservation.endTime ?? reservation.endDate;
  const status = reservation.status ?? 'Pending';
  const statusKey = normalizeStatus(status);

  const isPending = statusKey === 'pending';
  const isApproved = statusKey === 'approved';
  const isAdmin = userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'gridoperator';
  const isLoading = loadingId === rowId;

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.24,
        delay: Math.min(index * 0.025, 0.2),
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: { opacity: 0, x: -10, transition: { duration: 0.16 } },
  };

  return (
    <motion.tr
      layout
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={'reservation-ledger-row row-' + statusKey}
    >
      <td className="ledger-reference-cell">
        <span className="ledger-row-number">{String(index + 1).padStart(2, '0')}</span>
        <code>#{shortReference(rowId)}</code>
      </td>

      <td>
        <div className="ledger-person">
          <span>{String(prosumerNic)}</span>
          {consumerName && <small>{consumerName}</small>}
        </div>
      </td>

      <td>
        <Link to="/nodes" className="ledger-node" style={{ textDecoration: 'none', color: 'inherit' }} title="View microgrid node specifications">
          <Zap aria-hidden="true" />
          <span>
            {nodeName || shortReference(nodeId, 8)}
            {nodeName && <small>{shortReference(nodeId, 5)}</small>}
          </span>
        </Link>
      </td>

      <td>
        <div className="ledger-energy">
          <span>{formatEnergy(energy)}</span>
          {totalPrice > 0 && <small>LKR {totalPrice.toFixed(2)}</small>}
        </div>
      </td>

      <td>{formatDateTime(startTime)}</td>
      <td>{formatDateTime(endTime)}</td>

      <td><StatusMark status={status} /></td>

      <td>
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.span
              key="updating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ledger-updating"
            >
              <LoaderCircle aria-hidden="true" />
              Updating
            </motion.span>
          ) : isPending ? (
            isAdmin ? (
              <motion.div
                key="pending-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ledger-row-actions"
              >
                <button
                  type="button"
                  onClick={() => onApprove(rowId)}
                  disabled={isLoading}
                  className="row-action is-approve"
                  title="Approve energy slot reservation and dispatch QR"
                >
                  <Check aria-hidden="true" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReject(rowId)}
                  disabled={isLoading}
                  className="row-action is-reject"
                  title="Reject reservation request"
                >
                  <CircleX aria-hidden="true" />
                  Reject
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="non-admin-pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ledger-row-actions"
              >
                <span className="ledger-status is-pending" title="Awaiting operator review">
                  <Clock aria-hidden="true" />
                  Awaiting review
                </span>
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(rowId)}
                    disabled={isLoading}
                    className="row-action is-reject"
                    title="Withdraw / Cancel pending booking"
                  >
                    <XCircle aria-hidden="true" />
                    Cancel
                  </button>
                )}
              </motion.div>
            )
          ) : isApproved ? (
            <motion.div
              key="approved-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ledger-row-actions"
            >
              <button
                type="button"
                onClick={() => onViewQr(reservation)}
                className="row-action is-pass"
                title="Open dispatch verification pass"
              >
                <QrCode aria-hidden="true" />
                Pass
              </button>
              <button
                type="button"
                onClick={() => onCancel(rowId)}
                className="row-action is-muted"
                title="Cancel this reservation"
              >
                <Ban aria-hidden="true" />
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.span
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ledger-closed-action"
            >
              {statusKey === 'cancelled' ? <Ban aria-hidden="true" /> : <CircleX aria-hidden="true" />}
              No action needed
            </motion.span>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}
