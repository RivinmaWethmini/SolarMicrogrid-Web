import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RefreshCw,
  LoaderCircle,
  X,
  Users,
  Zap,
  BatteryCharging,
  ArrowLeft,
  Plus,
} from 'lucide-react';

import ProsumerRow from '../components/ProsumerRow';
import NavigationHeader from '../components/NavigationHeader';
import {
  getProsumers,
  createProsumer,
  updateProsumer,
  deactivateProsumer,
  reactivateProsumer,
} from '../services/prosumerApi';

const emptyForm = {
  nic: '',
  name: '',
  solarCapacityKw: '',
  batteryCapacityKwh: '',
  availableEnergyKw: '',
  pricePerKwh: '',
  location: '',
  microgridNodeId: '',
};

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.title) {
    return data.title;
  }

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }

  return fallback;
}

export default function ProsumerManagement() {
  const [prosumers, setProsumers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingProsumer, setEditingProsumer] = useState(null);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProsumers();
  }, []);

  async function fetchProsumers(showLoader = true) {
    if (showLoader) {
      setIsLoadingList(true);
    }

    try {
      const response = await getProsumers();

      setProsumers(response.data?.value || response.data || []);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not load prosumers. Please check the API connection.'
        )
      );
    } finally {
      if (showLoader) {
        setIsLoadingList(false);
      }
    }
  }

  function clearMessages() {
    setErrorMsg('');
    setSuccessMsg('');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    if (!form.nic.trim()) {
      setErrorMsg('NIC is required.');
      return;
    }

    if (!form.name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }

    if (!form.location.trim()) {
      setErrorMsg('Location is required.');
      return;
    }

    if (
      form.solarCapacityKw === '' ||
      Number(form.solarCapacityKw) < 0
    ) {
      setErrorMsg('Solar capacity must be zero or greater.');
      return;
    }

    if (
      form.batteryCapacityKwh === '' ||
      Number(form.batteryCapacityKwh) < 0
    ) {
      setErrorMsg('Battery capacity must be zero or greater.');
      return;
    }

    if (
      form.availableEnergyKw === '' ||
      Number(form.availableEnergyKw) < 0
    ) {
      setErrorMsg('Available energy must be zero or greater.');
      return;
    }

    if (
      form.pricePerKwh === '' ||
      Number(form.pricePerKwh) < 0
    ) {
      setErrorMsg('Price per kWh must be zero or greater.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nic: form.nic.trim(),
        name: form.name.trim(),
        solarCapacityKw: Number(form.solarCapacityKw),
        batteryCapacityKwh: Number(form.batteryCapacityKwh),
        availableEnergyKw: Number(form.availableEnergyKw),
        pricePerKwh: Number(form.pricePerKwh),
        location: form.location.trim(),
        microgridNodeId: form.microgridNodeId.trim() || null,
      };

      await createProsumer(payload);

      setForm(emptyForm);
      setSuccessMsg('Prosumer registered successfully.');

      await fetchProsumers(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Failed to register the prosumer.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(nic) {
    clearMessages();
    setLoadingId(nic);

    try {
      await deactivateProsumer(nic);

      setSuccessMsg('Prosumer deactivated successfully.');

      await fetchProsumers(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not deactivate the prosumer.'
        )
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReactivate(nic) {
    clearMessages();
    setLoadingId(nic);

    try {
      await reactivateProsumer(nic);

      setSuccessMsg('Prosumer reactivated successfully.');

      await fetchProsumers(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not reactivate the prosumer.'
        )
      );
    } finally {
      setLoadingId(null);
    }
  }

  function handleEdit(prosumer) {
    clearMessages();

    setEditingProsumer({
      nic: prosumer.nic,
      name: prosumer.name || '',
      solarCapacityKw: prosumer.solarCapacityKw ?? '',
      batteryCapacityKwh: prosumer.batteryCapacityKwh ?? '',
      availableEnergyKw: prosumer.availableEnergyKw ?? '',
      pricePerKwh: prosumer.pricePerKwh ?? '',
      location: prosumer.location || '',
      microgridNodeId: prosumer.microgridNodeId || '',
    });
  }

  async function handleUpdate(event) {
    event.preventDefault();
    clearMessages();

    if (!editingProsumer) {
      return;
    }

    if (!editingProsumer.name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }

    if (!editingProsumer.location.trim()) {
      setErrorMsg('Location is required.');
      return;
    }

    if (
      editingProsumer.solarCapacityKw === '' ||
      Number(editingProsumer.solarCapacityKw) < 0
    ) {
      setErrorMsg('Solar capacity must be zero or greater.');
      return;
    }

    if (
      editingProsumer.batteryCapacityKwh === '' ||
      Number(editingProsumer.batteryCapacityKwh) < 0
    ) {
      setErrorMsg('Battery capacity must be zero or greater.');
      return;
    }

    if (
      editingProsumer.availableEnergyKw === '' ||
      Number(editingProsumer.availableEnergyKw) < 0
    ) {
      setErrorMsg('Available energy must be zero or greater.');
      return;
    }

    if (
      editingProsumer.pricePerKwh === '' ||
      Number(editingProsumer.pricePerKwh) < 0
    ) {
      setErrorMsg('Price per kWh must be zero or greater.');
      return;
    }

    setIsUpdating(true);

    try {
      const payload = {
        nic: editingProsumer.nic,
        name: editingProsumer.name.trim(),
        solarCapacityKw: Number(editingProsumer.solarCapacityKw),
        batteryCapacityKwh: Number(editingProsumer.batteryCapacityKwh),
        availableEnergyKw: Number(editingProsumer.availableEnergyKw),
        pricePerKwh: Number(editingProsumer.pricePerKwh),
        location: editingProsumer.location.trim(),
        microgridNodeId:
          editingProsumer.microgridNodeId.trim() || null,
      };

      await updateProsumer(editingProsumer.nic, payload);

      setEditingProsumer(null);
      setSuccessMsg('Prosumer updated successfully.');

      await fetchProsumers(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Failed to update the prosumer.'
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const activeCount = prosumers.filter(
    (prosumer) => prosumer.isAvailable === true
  ).length;

  const inactiveCount = prosumers.length - activeCount;

  return (
    <main className="prosumer-page min-h-screen">
      <NavigationHeader subtitle="Prosumer Registry" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              to="/reservations"
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>

            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              <Users className="h-3.5 w-3.5" />
              Backoffice
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Prosumer Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Register, update and control prosumer profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchProsumers()}
            disabled={isLoadingList}
            className="secondary-btn"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingList ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </section>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="summary-card">
            <div className="mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="summary-label">
                Total Prosumers
              </span>
            </div>

            <strong className="summary-number text-slate-900">
              {prosumers.length}
            </strong>
          </div>

          <div className="summary-card">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="summary-label">
                Active Prosumers
              </span>
            </div>

            <strong className="summary-number text-emerald-600">
              {activeCount}
            </strong>
          </div>

          <div className="summary-card">
            <div className="mb-1 flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-slate-500" />
              <span className="summary-label">
                Inactive Prosumers
              </span>
            </div>

            <strong className="summary-number text-slate-500">
              {inactiveCount}
            </strong>
          </div>
        </section>

        {/* Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="alert-error"
            >
              <span>{errorMsg}</span>

              <button
                type="button"
                onClick={() => setErrorMsg('')}
                aria-label="Close error message"
                className="flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="alert-success"
            >
              <span>{successMsg}</span>

              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                aria-label="Close success message"
                className="flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Register New Prosumer */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="node-card p-6 sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Register New Prosumer
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the prosumer information below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {/* NIC */}
            <div>
              <label
                htmlFor="nic"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                NIC
              </label>

              <input
                id="nic"
                type="text"
                name="nic"
                value={form.nic}
                onChange={handleFormChange}
                placeholder="199812345678"
                className="node-input"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="John Perera"
                className="node-input"
                required
              />
            </div>

            {/* Solar Capacity */}
            <div>
              <label
                htmlFor="solarCapacityKw"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Solar Capacity (kW)
              </label>

              <input
                id="solarCapacityKw"
                type="number"
                name="solarCapacityKw"
                value={form.solarCapacityKw}
                onChange={handleFormChange}
                min="0"
                step="any"
                placeholder="5"
                className="node-input"
                required
              />
            </div>

            {/* Battery Capacity */}
            <div>
              <label
                htmlFor="batteryCapacityKwh"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Battery Capacity (kWh)
              </label>

              <input
                id="batteryCapacityKwh"
                type="number"
                name="batteryCapacityKwh"
                value={form.batteryCapacityKwh}
                onChange={handleFormChange}
                min="0"
                step="any"
                placeholder="10"
                className="node-input"
                required
              />
            </div>

            {/* Available Energy */}
            <div>
              <label
                htmlFor="availableEnergyKw"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Available Energy (kW)
              </label>

              <input
                id="availableEnergyKw"
                type="number"
                name="availableEnergyKw"
                value={form.availableEnergyKw}
                onChange={handleFormChange}
                min="0"
                step="any"
                placeholder="0"
                className="node-input"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="pricePerKwh"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Price per kWh
              </label>

              <input
                id="pricePerKwh"
                type="number"
                name="pricePerKwh"
                value={form.pricePerKwh}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="50"
                className="node-input"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Location
              </label>

              <input
                id="location"
                type="text"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                placeholder="Nugegoda"
                className="node-input"
                required
              />
            </div>

            {/* Microgrid Node */}
            <div>
              <label
                htmlFor="microgridNodeId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Microgrid Node ID
              </label>

              <input
                id="microgridNodeId"
                type="text"
                name="microgridNodeId"
                value={form.microgridNodeId}
                onChange={handleFormChange}
                placeholder="Optional"
                className="node-input"
              />
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-btn"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Registering
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Register Prosumer
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Registered Prosumers */}
        <section className="node-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              Registered Prosumers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {prosumers.length} prosumer
              {prosumers.length === 1 ? '' : 's'} registered
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-bold text-slate-500">
                  <th className="px-5 py-4">NIC</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Solar</th>
                  <th className="px-5 py-4">Battery</th>
                  <th className="px-5 py-4">Available Energy</th>
                  <th className="px-5 py-4">Price / kWh</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {isLoadingList ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                          <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" />
                          Loading prosumers
                        </div>
                      </td>
                    </tr>
                  ) : prosumers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-16 text-center text-sm text-slate-500"
                      >
                        No prosumers have been registered.
                      </td>
                    </tr>
                  ) : (
                    prosumers.map((prosumer, index) => (
                      <ProsumerRow
                        key={prosumer.nic}
                        prosumer={prosumer}
                        index={index}
                        loadingId={loadingId}
                        onEdit={handleEdit}
                        onDeactivate={handleDeactivate}
                        onReactivate={handleReactivate}
                      />
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </section>

        {/* Edit Prosumer Modal */}
        <AnimatePresence>
          {editingProsumer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Edit Prosumer
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Update the prosumer profile information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingProsumer(null)}
                    disabled={isUpdating}
                    aria-label="Close edit modal"
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdate}>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {/* NIC */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        NIC
                      </label>

                      <input
                        type="text"
                        value={editingProsumer.nic}
                        disabled
                        className="node-input bg-slate-100"
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        NIC cannot be changed.
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Name
                      </label>

                      <input
                        type="text"
                        value={editingProsumer.name}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        className="node-input"
                        required
                      />
                    </div>

                    {/* Solar */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Solar Capacity (kW)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editingProsumer.solarCapacityKw}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            solarCapacityKw: event.target.value,
                          }))
                        }
                        className="node-input"
                        required
                      />
                    </div>

                    {/* Battery */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Battery Capacity (kWh)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editingProsumer.batteryCapacityKwh}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            batteryCapacityKwh: event.target.value,
                          }))
                        }
                        className="node-input"
                        required
                      />
                    </div>

                    {/* Available Energy */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Available Energy (kW)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editingProsumer.availableEnergyKw}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            availableEnergyKw: event.target.value,
                          }))
                        }
                        className="node-input"
                        required
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Price per kWh
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingProsumer.pricePerKwh}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            pricePerKwh: event.target.value,
                          }))
                        }
                        className="node-input"
                        required
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Location
                      </label>

                      <input
                        type="text"
                        value={editingProsumer.location}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            location: event.target.value,
                          }))
                        }
                        className="node-input"
                        required
                      />
                    </div>

                    {/* Microgrid Node */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Microgrid Node ID
                      </label>

                      <input
                        type="text"
                        value={editingProsumer.microgridNodeId}
                        onChange={(event) =>
                          setEditingProsumer((previous) => ({
                            ...previous,
                            microgridNodeId: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                        className="node-input"
                      />
                    </div>
                  </div>

                  <div className="mt-7 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingProsumer(null)}
                      disabled={isUpdating}
                      className="secondary-btn"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="primary-btn"
                    >
                      {isUpdating ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}