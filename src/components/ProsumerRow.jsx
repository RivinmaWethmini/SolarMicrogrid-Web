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
      className="prosumer-table-row"
    >
      <td className="prosumer-td nic-cell">
        {prosumer.nic}
      </td>

      <td className="prosumer-td name-cell">
        {prosumer.name}
      </td>

      <td className="prosumer-td">
        {prosumer.solarCapacityKw} kW
      </td>

      <td className="prosumer-td">
        {prosumer.batteryCapacityKwh} kWh
      </td>

      <td className="prosumer-td">
        {prosumer.availableEnergyKw} kW
      </td>

      <td className="prosumer-td price-cell">
        Rs. {prosumer.pricePerKwh}
      </td>

      <td className="prosumer-td">
        {prosumer.location || '—'}
      </td>

      <td className="prosumer-td">
        <span
          className={
            isActive
              ? 'prosumer-status active'
              : 'prosumer-status inactive'
          }
        >
          <span className="status-dot" />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      <td className="prosumer-td">
        <div className="prosumer-actions">
          <button
            type="button"
            onClick={() => onEdit(prosumer)}
            disabled={isLoading}
            className="prosumer-action edit"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>

          {isActive ? (
            <button
              type="button"
              onClick={() => onDeactivate(prosumer.nic)}
              disabled={isLoading}
              className="prosumer-action deactivate"
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
              className="prosumer-action reactivate"
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