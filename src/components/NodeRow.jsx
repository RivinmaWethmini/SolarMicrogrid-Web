import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Pencil, PowerOff, Power, LoaderCircle } from 'lucide-react';

const statusStyles = {
  active: {
    label: 'Active',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactive',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
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
    <span className={`status-badge ${config.badge}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
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
      className="bg-white transition-colors hover:bg-slate-50"
    >
      <td className="whitespace-nowrap px-5 py-5">
        <span className="font-mono text-xs font-semibold tracking-wider text-slate-500">
          #{String(rowId || '').slice(0, 8).toUpperCase()}
        </span>
      </td>

      <td className="px-5 py-5">
        <span className="block max-w-[180px] truncate text-sm font-bold text-slate-800">
          {node.name || '—'}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-5">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
          <MapPin className="h-3.5 w-3.5" />
          {formatCoordinate(node.latitude)},{' '}
          {formatCoordinate(node.longitude)}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-5">
        <span className="text-sm font-bold text-amber-600">
          {formatCapacity(node.capacityKWh)}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-5">
        <span className="text-sm font-semibold text-slate-600">
          {node.batterySlots ?? '—'} slots
        </span>
      </td>

      <td className="px-5 py-5">
        <span className="block max-w-[180px] text-sm text-slate-600">
          {node.schedule || 'Not specified'}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-5">
        <StatusBadge status={node.status} />
      </td>

      <td className="whitespace-nowrap px-5 py-5">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500"
            >
              <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" />
              Processing
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => onEdit(node)}
                className="edit-btn"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>

              {isActive ? (
                <button
                  type="button"
                  onClick={() => onDeactivate(rowId)}
                  className="deactivate-btn"
                >
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onReactivate(rowId)}
                  className="reactivate-btn"
                >
                  <Power className="h-4 w-4" />
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