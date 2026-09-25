import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Plus, LoaderCircle, X, Network, Zap, BatteryCharging } from 'lucide-react';
import NavigationHeader from '../components/NavigationHeader';
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
    <div className={`node-field ${className}`.trim()}>
      <label htmlFor={name} className="node-field-label">
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
        className="node-field-input"
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
    <div className="operations-shell">
      <NavigationHeader subtitle="Node registry" />

      <main className="operations-workspace node-workspace">
        <section className="node-hero" aria-labelledby="node-management-title">
          <div className="operations-heading node-heading">
            <div className="section-coordinate">
              <span>02</span>
              <p>Infrastructure / node registry</p>
            </div>

            <h1 id="node-management-title">
              Solar node <em>registry.</em>
            </h1>

            <p className="operations-intro">
              Register, update and control the solar hubs connected to the live microgrid.
            </p>
          </div>

          <aside className="node-hero-console" aria-label="Node registry control">
            <span className="node-console-index">Network control / 02</span>
            <div className="node-console-status">
              <i aria-hidden="true" />
              Registry synchronized
            </div>
            <p>Refresh the registry to pull the latest capacity, battery and operating status.</p>

            <button
              type="button"
              onClick={() => fetchNodes()}
              disabled={isLoadingList}
              className="sync-control node-refresh-control"
            >
              <RefreshCw className={isLoadingList ? 'is-spinning' : ''} />
              {isLoadingList ? 'Synchronizing' : 'Synchronize nodes'}
            </button>
          </aside>
        </section>

        <section className="node-metrics" aria-label="Node registry telemetry">
          <article className="node-metric">
            <div className="node-metric-head">
              <span>01 / Registered</span>
              <Network aria-hidden="true" />
            </div>
            <strong>{nodes.length}</strong>
            <p>Total solar nodes</p>
          </article>

          <article className="node-metric is-positive">
            <div className="node-metric-head">
              <span>02 / Live</span>
              <Zap aria-hidden="true" />
            </div>
            <strong>{activeCount}</strong>
            <p>Active dispatch nodes</p>
          </article>

          <article className="node-metric is-muted">
            <div className="node-metric-head">
              <span>03 / Offline</span>
              <BatteryCharging aria-hidden="true" />
            </div>
            <strong>{inactiveCount}</strong>
            <p>Inactive nodes</p>
          </article>
        </section>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="node-notice is-error"
              role="alert"
            >
              <span>{errorMsg}</span>

              <button
                type="button"
                onClick={() => setErrorMsg('')}
                aria-label="Close error message"
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
              className="node-notice is-success"
              role="status"
            >
              <span>{successMsg}</span>

              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                aria-label="Close success message"
                className="node-notice-close"
              >
                <X aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="node-panel node-registration-panel"
          aria-labelledby="register-node-title"
        >
          <div className="node-panel-heading">
            <div>
              <span>Registry command / New entry</span>
              <h2 id="register-node-title">
              Register New Node
              </h2>

              <p>Enter the solar hub information below.</p>
            </div>
            <Plus aria-hidden="true" />
          </div>

          <div className="node-form-grid">
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

          <div className="node-panel-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="node-command is-primary"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="is-spinning" aria-hidden="true" />
                  Registering
                </>
              ) : (
                <>
                  <Plus aria-hidden="true" />
                  Register Node
                </>
              )}
            </button>
          </div>
        </motion.form>

        <section className="node-ledger" aria-labelledby="registered-nodes-title">
          <div className="node-ledger-heading">
            <div>
              <span>Live infrastructure manifest</span>
              <h2 id="registered-nodes-title">
              Registered Nodes
              </h2>

              <p>
                {nodes.length} microgrid node
                {nodes.length === 1 ? '' : 's'} registered
              </p>
            </div>
            <span className="node-ledger-count">{String(nodes.length).padStart(2, '0')} units</span>
          </div>

          <div className="node-table-wrap">
            <table className="node-ledger-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Slots</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence>
                  {isLoadingList ? (
                    <tr className="node-table-state-row">
                      <td colSpan={8}>
                        <div className="node-table-state" role="status">
                          <LoaderCircle className="is-spinning" aria-hidden="true" />
                          Loading nodes
                        </div>
                      </td>
                    </tr>
                  ) : nodes.length === 0 ? (
                    <tr className="node-table-state-row">
                      <td colSpan={8}>
                        <div className="node-table-state is-empty">
                          <Network aria-hidden="true" />
                          <span>No microgrid nodes have been registered.</span>
                        </div>
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
      </main>

      <AnimatePresence>
        {editingNode && (
          <motion.div
            className="node-modal-overlay"
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
              className="node-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-node-title"
            >
              <div className="node-modal-head">
                <div>
                  <span>Registry command / Edit entry</span>
                  <h2 id="edit-node-title">
                    Edit Microgrid Node
                  </h2>

                  <p>Update the selected node information.</p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="node-modal-close"
                  aria-label="Close edit modal"
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="node-modal-form">
                <div className="node-modal-grid">
                  <FormField
                    label="Node Name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    className="node-field-wide"
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
                    className="node-field-wide"
                  />
                </div>

                {editError && (
                  <div className="node-notice is-error node-modal-error" role="alert">
                    {editError}
                  </div>
                )}

                <div className="node-modal-actions">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="node-command is-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="node-command is-primary"
                  >
                    {isUpdating ? (
                      <>
                        <LoaderCircle className="is-spinning" aria-hidden="true" />
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
  );
}
