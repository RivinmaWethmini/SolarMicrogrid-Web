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
  Plus,
  Edit3,
  Power,
  RotateCcw,
  ShieldCheck,
  Search,
} from 'lucide-react';

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
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return fallback;
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  step,
  min,
  max,
  required = false,
}) {
  return (
    <div className="node-form-group">
      <label htmlFor={name} className="node-label">
        {label}
        {required ? <span className="node-required">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="node-input"
      />
    </div>
  );
}

export default function ProsumerManagement() {
  const [prosumers, setProsumers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProsumer, setEditingProsumer] = useState(null);
  const [search, setSearch] = useState('');

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchProsumers();
  }, []);

  async function fetchProsumers(showLoader = true) {
    if (showLoader) {
      setIsLoadingList(true);
    }
    try {
      const response = await getProsumers();
      setProsumers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not load prosumers. Please verify the API connection.'
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

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditingProsumer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleRegister(event) {
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
      setErrorMsg(getErrorMessage(error, 'Failed to register prosumer.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(prosumer) {
    setEditingProsumer({
      ...prosumer,
      solarCapacityKw: prosumer.solarCapacityKw ?? '',
      batteryCapacityKwh: prosumer.batteryCapacityKwh ?? '',
      availableEnergyKw: prosumer.availableEnergyKw ?? '',
      pricePerKwh: prosumer.pricePerKwh ?? '',
      location: prosumer.location || '',
      microgridNodeId: prosumer.microgridNodeId || '',
    });
    setEditError('');
  }

  function closeEditModal() {
    if (isUpdating) return;
    setEditingProsumer(null);
    setEditError('');
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setEditError('');

    if (!editingProsumer) return;
    if (!editingProsumer.name.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!editingProsumer.location.trim()) {
      setEditError('Location is required.');
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
        microgridNodeId: editingProsumer.microgridNodeId?.trim() || null,
      };

      await updateProsumer(editingProsumer.nic, payload);
      setEditingProsumer(null);
      setSuccessMsg('Prosumer specs updated successfully.');
      await fetchProsumers(false);
    } catch (error) {
      setEditError(getErrorMessage(error, 'Failed to update prosumer specs.'));
    } finally {
      setIsUpdating(false);
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
      setErrorMsg(getErrorMessage(error, 'Could not deactivate prosumer.'));
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
      setErrorMsg(getErrorMessage(error, 'Could not reactivate prosumer.'));
    } finally {
      setLoadingId(null);
    }
  }

  const activeCount = prosumers.filter((p) => p.isAvailable === true).length;
  const inactiveCount = prosumers.length - activeCount;

  const filteredProsumers = prosumers.filter((p) => {
    const term = search.toLowerCase();
    const nic = (p.nic || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const loc = (p.location || '').toLowerCase();
    return nic.includes(term) || name.includes(term) || loc.includes(term);
  });

  return (
    <div className="operations-shell">
      <NavigationHeader subtitle="Prosumer registry" />

      <main className="operations-workspace node-workspace">
        {/* Unified Hero Section */}
        <section className="node-hero" aria-labelledby="prosumer-title">
          <div className="operations-heading node-heading">
            <div className="section-coordinate">
              <span>01</span>
              <p>User Infrastructure / Prosumer Registry</p>
            </div>

            <h1 id="prosumer-title">
              Prosumer <em>registry.</em>
            </h1>

            <p className="operations-intro">
              Register, calibrate hardware specifications, activate tariffs, and manage distributed solar energy prosumer profiles across grid clusters.
            </p>
          </div>

          <aside className="node-hero-console" aria-label="Prosumer registry control">
            <span className="node-console-index">Prosumer Asset Control</span>
            <div className="node-console-status">
              <i aria-hidden="true" />
              Registry synchronized
            </div>
            <p>Pulling real-time generation capacity, battery storage, and dynamic tariffs.</p>

            <button
              type="button"
              onClick={() => fetchProsumers()}
              disabled={isLoadingList}
              className="sync-control node-refresh-control"
            >
              <RefreshCw className={isLoadingList ? 'is-spinning' : ''} />
              {isLoadingList ? 'Synchronizing' : 'Synchronize prosumers'}
            </button>
          </aside>
        </section>

        {/* Telemetry Metrics Rail */}
        <section className="node-metrics" aria-label="Prosumer registry telemetry">
          <article className="node-metric">
            <div className="node-metric-head">
              <span>01 / Registered</span>
              <Users aria-hidden="true" />
            </div>
            <strong>{prosumers.length}</strong>
            <p>Total prosumer profiles</p>
          </article>

          <article className="node-metric is-positive">
            <div className="node-metric-head">
              <span>02 / Active</span>
              <Zap aria-hidden="true" />
            </div>
            <strong>{activeCount}</strong>
            <p>Trading authorized & active</p>
          </article>

          <article className="node-metric is-muted">
            <div className="node-metric-head">
              <span>03 / Inactive</span>
              <BatteryCharging aria-hidden="true" />
            </div>
            <strong>{inactiveCount}</strong>
            <p>Deactivated or paused profiles</p>
          </article>
        </section>

        {/* Status Notices */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="node-notice is-error mt-6"
              role="alert"
            >
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                aria-label="Close error notice"
                className="node-notice-close"
              >
                <X aria-hidden="true" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="node-notice is-success mt-6"
              role="status"
            >
              <span>{successMsg}</span>
              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                aria-label="Close success notice"
                className="node-notice-close"
              >
                <X aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Register New Prosumer Form Panel */}
        <motion.form
          onSubmit={handleRegister}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="node-panel node-registration-panel mt-8"
          aria-labelledby="register-prosumer-title"
        >
          <div className="node-panel-heading">
            <div>
              <span>Registry command / New entry</span>
              <h2 id="register-prosumer-title">Register New Prosumer</h2>
              <p>Enter the distributed solar producer details and electrical specifications below.</p>
            </div>
            <Plus aria-hidden="true" />
          </div>

          <div className="node-form-grid">
            <FormField
              label="National ID (NIC)"
              name="nic"
              value={form.nic}
              onChange={handleFormChange}
              placeholder="199812345678"
              required
            />

            <FormField
              label="Prosumer Name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="SunPower Station A"
              required
            />

            <FormField
              label="Solar Capacity (kW)"
              name="solarCapacityKw"
              type="number"
              step="any"
              min="0"
              value={form.solarCapacityKw}
              onChange={handleFormChange}
              placeholder="25.0"
              required
            />

            <FormField
              label="Battery Capacity (kWh)"
              name="batteryCapacityKwh"
              type="number"
              step="any"
              min="0"
              value={form.batteryCapacityKwh}
              onChange={handleFormChange}
              placeholder="50.0"
              required
            />

            <FormField
              label="Available Energy (kW)"
              name="availableEnergyKw"
              type="number"
              step="any"
              min="0"
              value={form.availableEnergyKw}
              onChange={handleFormChange}
              placeholder="15.0"
              required
            />

            <FormField
              label="Tariff (Rs. / kWh)"
              name="pricePerKwh"
              type="number"
              step="0.01"
              min="0"
              value={form.pricePerKwh}
              onChange={handleFormChange}
              placeholder="45.00"
              required
            />

            <FormField
              label="Installation Location"
              name="location"
              value={form.location}
              onChange={handleFormChange}
              placeholder="Kaduwela Substation Cluster"
              required
            />

            <FormField
              label="Assigned Node ID"
              name="microgridNodeId"
              value={form.microgridNodeId}
              onChange={handleFormChange}
              placeholder="Optional Node Link (e.g. NODE-MALABE-01)"
            />
          </div>

          <div className="node-panel-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="node-command is-primary"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="is-spinning" aria-hidden="true" />
                  Registering Prosumer...
                </>
              ) : (
                <>
                  <Plus aria-hidden="true" />
                  Register Prosumer
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Prosumer Manifest Table */}
        <section className="node-ledger mt-10" aria-labelledby="registered-prosumers-title">
          <div className="node-ledger-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span>Live infrastructure manifest</span>
              <h2 id="registered-prosumers-title">Registered Prosumers</h2>
              <p>
                {prosumers.length} solar prosumer{prosumers.length === 1 ? '' : 's'} registered in the central microgrid database.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search prosumers by name, NIC, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="node-input"
                style={{ paddingLeft: '36px', height: '40px', fontSize: '12px' }}
              />
              <Search className="w-4 h-4 text-[#8c9288] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="node-table-frame">
            <table className="node-table">
              <thead>
                <tr>
                  <th scope="col">NIC / Identifier</th>
                  <th scope="col">Prosumer Name</th>
                  <th scope="col">Solar Cap.</th>
                  <th scope="col">Battery</th>
                  <th scope="col">Available</th>
                  <th scope="col">Tariff</th>
                  <th scope="col">Location</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingList ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-[#8c9288] font-mono text-xs">
                      Synchronizing prosumer manifest from central grid node...
                    </td>
                  </tr>
                ) : filteredProsumers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-[#8c9288] font-mono text-xs">
                      {search ? 'No prosumers match your filter query.' : 'No prosumers registered yet. Use the form above to add an entry.'}
                    </td>
                  </tr>
                ) : (
                  filteredProsumers.map((p, idx) => {
                    const isActive = p.isAvailable === true;
                    const isLoading = loadingId === p.nic;

                    return (
                      <motion.tr
                        key={p.nic || idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="prosumer-table-row"
                      >
                        <td className="font-mono text-xs text-[#FFD000]">{p.nic}</td>
                        <td className="font-medium text-white">{p.name}</td>
                        <td>{p.solarCapacityKw} kW</td>
                        <td>{p.batteryCapacityKwh} kWh</td>
                        <td className="text-emerald-400 font-mono">{p.availableEnergyKw} kW</td>
                        <td className="font-mono">Rs. {p.pricePerKwh}</td>
                        <td className="text-[#b1b5ac] text-xs">{p.location || '—'}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              disabled={isLoading}
                              className="px-3 py-1 text-xs border border-white/10 hover:border-[#FFD000] text-slate-200 hover:text-[#FFD000] rounded transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                              Edit
                            </button>

                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(p.nic)}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                              >
                                <Power className="w-3.5 h-3.5 inline mr-1" />
                                Pause
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivate(p.nic)}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                                Resume
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingProsumer && (
            <div
              className="dispatch-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeEditModal();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="node-panel max-w-2xl w-full mx-4 relative"
                style={{ backgroundColor: '#0f1110', border: '1px solid var(--ops-line-strong)' }}
              >
                <div className="flex items-center justify-between pb-4 border-b border-[var(--ops-line)] mb-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--ops-solar)]">Edit Hardware Profile</span>
                    <h3 className="text-xl font-normal text-white">Prosumer #{editingProsumer.nic}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="node-notice-close"
                  >
                    <X className="w-5 h-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                {editError && (
                  <div className="node-notice is-error mb-4">
                    <span>{editError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdate}>
                  <div className="node-form-grid mb-6">
                    <FormField
                      label="Prosumer Name"
                      name="name"
                      value={editingProsumer.name}
                      onChange={handleEditChange}
                      required
                    />
                    <FormField
                      label="Solar Capacity (kW)"
                      name="solarCapacityKw"
                      type="number"
                      step="any"
                      min="0"
                      value={editingProsumer.solarCapacityKw}
                      onChange={handleEditChange}
                      required
                    />
                    <FormField
                      label="Battery Capacity (kWh)"
                      name="batteryCapacityKwh"
                      type="number"
                      step="any"
                      min="0"
                      value={editingProsumer.batteryCapacityKwh}
                      onChange={handleEditChange}
                      required
                    />
                    <FormField
                      label="Available Energy (kW)"
                      name="availableEnergyKw"
                      type="number"
                      step="any"
                      min="0"
                      value={editingProsumer.availableEnergyKw}
                      onChange={handleEditChange}
                      required
                    />
                    <FormField
                      label="Tariff (Rs. / kWh)"
                      name="pricePerKwh"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProsumer.pricePerKwh}
                      onChange={handleEditChange}
                      required
                    />
                    <FormField
                      label="Location"
                      name="location"
                      value={editingProsumer.location}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ops-line)]">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 text-xs border border-white/10 hover:border-white/20 text-slate-300 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="sync-control"
                      style={{ minHeight: '38px', padding: '0 20px', fontSize: '12px' }}
                    >
                      {isUpdating ? 'Saving Specs...' : 'Save Profile Specs'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}