import { motion } from 'framer-motion';
import { Edit3, Power, RotateCcw } from 'lucide-react';

export default function ProsumerRow({
  prosumer,
  index,
  loadingId,
  onEdit,
  onDeactivate,
  onReactivate,
}) {
  const isActive = prosumer.isAvailable === true;
  const isLoading = loadingId === prosumer.nic;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="hover:bg-slate-50"
    >
      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
        {prosumer.nic}
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {prosumer.name}
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {prosumer.solarCapacityKw} kW
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {prosumer.batteryCapacityKwh} kWh
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {prosumer.availableEnergyKw} kW
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        Rs. {prosumer.pricePerKwh}
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {prosumer.location || '—'}
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(prosumer)}
            disabled={isLoading}
            className="secondary-btn"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>

          {isActive ? (
            <button
              type="button"
              onClick={() => onDeactivate(prosumer.nic)}
              disabled={isLoading}
              className="secondary-btn"
            >
              {isLoading ? (
                'Updating'
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Deactivate
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReactivate(prosumer.nic)}
              disabled={isLoading}
              className="primary-btn"
            >
              {isLoading ? (
                'Updating'
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Reactivate
                </>
              )}
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}