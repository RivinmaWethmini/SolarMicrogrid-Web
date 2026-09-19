import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NodeRow from '../components/NodeRow';
import { getNodes, createNode, deactivateNode, reactivateNode } from '../services/nodeApi';

// ─── NodeManagement Page ────────────────────────────────────────────────────
// Backoffice / Grid Operator page for registering microgrid nodes and
// viewing / deactivating existing ones. All validation (e.g. blocking
// deactivation while active reservations exist) is enforced by the C# API —
// this page only surfaces whatever message the API returns.
export default function NodeManagement() {
  const [nodes, setNodes] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Registration form state
  const [form, setForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    capacityKWh: '',
    batterySlots: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load nodes on mount
  useEffect(() => {
    fetchNodes();
  }, []);

  async function fetchNodes() {
    setIsLoadingList(true);
    try {
      const res = await getNodes();
      setNodes(res.data);
    } catch (err) {
      setErrorMsg('Could not load microgrid nodes. Please try again.');
    } finally {
      setIsLoadingList(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        capacityKWh: parseFloat(form.capacityKWh),
        batterySlots: parseInt(form.batterySlots, 10),
      };
      await createNode(payload);
      setSuccessMsg('Node registered successfully.');
      setForm({ name: '', latitude: '', longitude: '', capacityKWh: '', batterySlots: '' });
      fetchNodes();
    } catch (err) {
      // Surface the API's own validation message rather than inventing one here
      setErrorMsg(err?.response?.data?.message ?? 'Failed to register node.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(id) {
    setLoadingId(id);
    setErrorMsg('');
    try {
      await deactivateNode(id);
      fetchNodes();
    } catch (err) {
      // 409 Conflict expected when active reservations block deactivation
      setErrorMsg(err?.response?.data?.message ?? 'Could not deactivate node.');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReactivate(id) {
    setLoadingId(id);
    setErrorMsg('');
    try {
      await reactivateNode(id);
      fetchNodes();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? 'Could not reactivate node.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Microgrid Node Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Register new solar grid hubs and manage existing nodes.
        </p>
      </div>

      {/* Registration Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/[0.03] border border-white/10 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div className="lg:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Node Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-solar-400/50"
            placeholder="e.g. Negombo Hub 01"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            required
            className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-solar-400/50"
            placeholder="7.2083"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            required
            className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-solar-400/50"
            placeholder="79.8358"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Capacity (kW/h)</label>
          <input
            type="number"
            step="any"
            name="capacityKWh"
            value={form.capacityKWh}
            onChange={handleChange}
            required
            className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-solar-400/50"
            placeholder="150"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Battery Slots</label>
          <input
            type="number"
            name="batterySlots"
            value={form.batterySlots}
            onChange={handleChange}
            required
            className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-solar-400/50"
            placeholder="8"
          />
        </div>

        <div className="lg:col-span-5 flex items-center justify-end gap-3 pt-2">
          <AnimatePresence>
            {errorMsg && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-300 mr-auto"
              >
                {errorMsg}
              </motion.span>
            )}
            {successMsg && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-300 mr-auto"
              >
                {successMsg}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isSubmitting}
            className="approve-btn"
          >
            {isSubmitting ? 'Registering…' : 'Register Node'}
          </motion.button>
        </div>
      </motion.form>

      {/* Nodes Overview Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3">Node ID</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Capacity</th>
              <th className="px-5 py-3">Battery Slots</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isLoadingList ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                    Loading nodes…
                  </td>
                </tr>
              ) : nodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                    No microgrid nodes registered yet.
                  </td>
                </tr>
              ) : (
                nodes.map((node, index) => (
                  <NodeRow
                    key={node.id ?? node.nodeId}
                    node={node}
                    index={index}
                    loadingId={loadingId}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                  />
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}