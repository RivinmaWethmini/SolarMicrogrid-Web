import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Pencil, PowerOff, Power, LoaderCircle } from 'lucide-react';

const statusStyles = {
  active: {
    label: 'Active',
    className: 'is-active',
  },
  inactive: {
    label: 'Inactive',
    className: 'is-inactive',
  },
};

function formatCapacity(value) {
  const capacity = Number(value);

  if (!Number.isFinite(capacity)) {
    return '—';
  }

  if (capacity >= 1000) {
    return `${(capacity / 1000).toFixed(2)} MWh`;
  }

  return `${capacity} kWh`;
}

function formatCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate.toFixed(4) : '—';
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'inactive').toLowerCase();
  const config =
    statusStyles[normalizedStatus] ?? statusStyles.inactive;

  return (
    <span className={`node-status ${config.className}`}>
      <i aria-hidden="true" />
      {config.label}
    </span>
  );
}

export default function NodeRow({
  node,
  onEdit,
  onDeactivate,
  onReactivate,
  loadingId,
  index,
}) {
  const rowId = node.id ?? node.nodeId;
  const isLoading = loadingId === rowId;
  const isActive =
    String(node.status).toLowerCase() === 'active';

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          delay: index * 0.04,
        },
      }}
      exit={{ opacity: 0, x: -20 }}
      className={`node-ledger-row ${isActive ? 'is-active' : 'is-inactive'}`}
    >
      <td className="node-reference-cell">
        <code>
          #{String(rowId || '').slice(0, 8).toUpperCase()}
        </code>
      </td>

      <td className="node-name-cell">
        <strong>
          {node.name || '—'}
        </strong>
      </td>

      <td className="node-location-cell">
        <span className="node-location">
          <MapPin aria-hidden="true" />
          {formatCoordinate(node.latitude)},{' '}
          {formatCoordinate(node.longitude)}
        </span>
      </td>

      <td className="node-capacity-cell">
        <span className="node-capacity">
          {formatCapacity(node.capacityKWh)}
        </span>
      </td>

      <td className="node-slots-cell">
        <span className="node-slot-count">
          {node.batterySlots ?? '—'} slots
        </span>
      </td>

      <td className="node-schedule-cell">
        <span className="node-schedule">
          {node.schedule || 'Not specified'}
        </span>
      </td>

      <td className="node-status-cell">
        <StatusBadge status={node.status} />
      </td>

      <td className="node-actions-cell">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="node-row-progress"
            >
              <LoaderCircle className="is-spinning" aria-hidden="true" />
              Processing
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="node-row-actions"
            >
              <button
                type="button"
                onClick={() => onEdit(node)}
                className="node-row-action is-edit"
              >
                <Pencil aria-hidden="true" />
                Edit
              </button>

              {isActive ? (
                <button
                  type="button"
                  onClick={() => onDeactivate(rowId)}
                  className="node-row-action is-deactivate"
                >
                  <PowerOff aria-hidden="true" />
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onReactivate(rowId)}
                  className="node-row-action is-reactivate"
                >
                  <Power aria-hidden="true" />
                  Reactivate
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}
