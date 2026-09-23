import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NodeRow from '../components/NodeRow';
import {
  getNodes,
  createNode,
  updateNode,
  deactivateNode,
  reactivateNode,
} from '../services/nodeApi';

const emptyForm = {
  name: '',
  latitude: '',
  longitude: '',
  capacityKWh: '',
  batterySlots: '',
  schedule: '',
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

function validateForm(form) {
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const capacityKWh = Number(form.capacityKWh);
  const batterySlots = Number(form.batterySlots);

  if (!form.name.trim()) {
    return 'Node name is required.';
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return 'Latitude must be between -90 and 90.';
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return 'Longitude must be between -180 and 180.';
  }

  if (!Number.isFinite(capacityKWh) || capacityKWh <= 0) {
    return 'Capacity must be greater than zero.';
  }

  if (
    !Number.isInteger(batterySlots) ||
    batterySlots <= 0
  ) {
    return 'Battery slots must be a positive whole number.';
  }

  return '';
}

function createPayload(form) {
  return {
    name: form.name.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    capacityKWh: Number(form.capacityKWh),
    batterySlots: Number(form.batterySlots),
    schedule: form.schedule.trim() || null,
  };
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
  className = '',
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        required={required}
        className="node-input"
      />
    </div>
  );
}

export default function NodeManagement() {
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingNode, setEditingNode] = useState(null);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchNodes();
  }, []);

  async function fetchNodes(showLoader = true) {
    if (showLoader) {
      setIsLoadingList(true);
    }

    try {
      const response = await getNodes();
      setNodes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not load microgrid nodes. Please check the API connection.'
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

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    const validationMessage = validateForm(form);

    if (validationMessage) {
      setErrorMsg(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      await createNode(createPayload(form));
      setForm(emptyForm);
      setSuccessMsg('Node registered successfully.');
      await fetchNodes(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(error, 'Failed to register the node.')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(node) {
    const rowId = node.id ?? node.nodeId;

    setEditingNode({
      ...node,
      id: rowId,
    });

    setEditForm({
      name: node.name ?? '',
      latitude: node.latitude ?? '',
      longitude: node.longitude ?? '',
      capacityKWh: node.capacityKWh ?? '',
      batterySlots: node.batterySlots ?? '',
      schedule: node.schedule ?? '',
    });

    setEditError('');
  }

  function closeEditModal() {
    if (isUpdating) {
      return;
    }

    setEditingNode(null);
    setEditForm(emptyForm);
    setEditError('');
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setEditError('');

    const validationMessage = validateForm(editForm);

    if (validationMessage) {
      setEditError(validationMessage);
      return;
    }

    if (!editingNode?.id) {
      setEditError('Node ID could not be found.');
      return;
    }

    setIsUpdating(true);

    try {
      await updateNode(editingNode.id, createPayload(editForm));
      setEditingNode(null);
      setEditForm(emptyForm);
      setSuccessMsg('Node updated successfully.');
      setErrorMsg('');
      await fetchNodes(false);
    } catch (error) {
      setEditError(
        getErrorMessage(error, 'Failed to update the node.')
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeactivate(id) {
    clearMessages();
    setLoadingId(id);

    try {
      await deactivateNode(id);
      setSuccessMsg('Node deactivated successfully.');
      await fetchNodes(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not deactivate the node.'
        )
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReactivate(id) {
    clearMessages();
    setLoadingId(id);

    try {
      await reactivateNode(id);
      setSuccessMsg('Node reactivated successfully.');
      await fetchNodes(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not reactivate the node.'
        )
      );
    } finally {
      setLoadingId(null);
    }
  }

  const activeCount = nodes.filter(
    (node) => String(node.status).toLowerCase() === 'active'
  ).length;

  const inactiveCount = nodes.length - activeCount;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              Grid Operator
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Microgrid Node Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Register, update and control solar microgrid nodes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchNodes()}
            disabled={isLoadingList}
            className="secondary-btn"
          >
            <svg
              className={`h-4 w-4 ${
                isLoadingList ? 'animate-spin' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v6h6M20 20v-6h-6M5.64 18.36A9 9 0 0018.36 5.64M18.36 5.64H14M5.64 18.36H10"
              />
            </svg>
            Refresh
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="summary-card">
            <span className="summary-label">Total Nodes</span>
            <strong className="summary-number text-slate-900">
              {nodes.length}
            </strong>
          </div>

          <div className="summary-card">
            <span className="summary-label">Active Nodes</span>
            <strong className="summary-number text-emerald-600">
              {activeCount}
            </strong>
          </div>

          <div className="summary-card">
            <span className="summary-label">Inactive Nodes</span>
            <strong className="summary-number text-slate-500">
              {inactiveCount}
            </strong>
          </div>
        </section>

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
              >
                ×
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
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="node-card p-6 sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Register New Node
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the solar hub information below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <FormField
              label="Node Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Malabe Solar Hub"
              required
            />

            <FormField
              label="Latitude"
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={form.latitude}
              onChange={handleChange}
              placeholder="6.9147"
              required
            />

            <FormField
              label="Longitude"
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={form.longitude}
              onChange={handleChange}
              placeholder="79.9729"
              required
            />

            <FormField
              label="Capacity (kWh)"
              name="capacityKWh"
              type="number"
              step="any"
              min="0.01"
              value={form.capacityKWh}
              onChange={handleChange}
              placeholder="500"
              required
            />

            <FormField
              label="Battery Slots"
              name="batterySlots"
              type="number"
              step="1"
              min="1"
              value={form.batterySlots}
              onChange={handleChange}
              placeholder="10"
              required
            />

            <FormField
              label="Operating Schedule"
              name="schedule"
              value={form.schedule}
              onChange={handleChange}
              placeholder="08:00 AM - 06:00 PM"
            />
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="button-spinner" />
                  Registering
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Register Node
                </>
              )}
            </button>
          </div>
        </motion.form>

        <section className="node-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              Registered Nodes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {nodes.length} microgrid node
              {nodes.length === 1 ? '' : 's'} registered
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Node ID</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Capacity</th>
                  <th className="px-5 py-4">Slots</th>
                  <th className="px-5 py-4">Schedule</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {isLoadingList ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                          <span className="loading-spinner" />
                          Loading nodes
                        </div>
                      </td>
                    </tr>
                  ) : nodes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center text-sm text-slate-500"
                      >
                        No microgrid nodes have been registered.
                      </td>
                    </tr>
                  ) : (
                    nodes.map((node, index) => (
                      <NodeRow
                        key={node.id ?? node.nodeId}
                        node={node}
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
      </div>

      <AnimatePresence>
        {editingNode && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeEditModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal-card"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-200 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit Microgrid Node
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the selected node information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="modal-close"
                  aria-label="Close edit modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    label="Node Name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    className="sm:col-span-2"
                  />

                  <FormField
                    label="Latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={editForm.latitude}
                    onChange={handleEditChange}
                    required
                  />

                  <FormField
                    label="Longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={editForm.longitude}
                    onChange={handleEditChange}
                    required
                  />

                  <FormField
                    label="Capacity (kWh)"
                    name="capacityKWh"
                    type="number"
                    step="any"
                    min="0.01"
                    value={editForm.capacityKWh}
                    onChange={handleEditChange}
                    required
                  />

                  <FormField
                    label="Battery Slots"
                    name="batterySlots"
                    type="number"
                    step="1"
                    min="1"
                    value={editForm.batterySlots}
                    onChange={handleEditChange}
                    required
                  />

                  <FormField
                    label="Operating Schedule"
                    name="schedule"
                    value={editForm.schedule}
                    onChange={handleEditChange}
                    placeholder="08:00 AM - 06:00 PM"
                    className="sm:col-span-2"
                  />
                </div>

                {editError && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {editError}
                  </div>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
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
                        <span className="button-spinner" />
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
    </main>
  );
}