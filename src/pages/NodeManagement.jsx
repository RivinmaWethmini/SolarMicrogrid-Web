import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';



import {

  Activity,

  AlertCircle,

  CheckCircle2,

  CircleOff,

  LoaderCircle,

  Network,

  Plus,

  RefreshCw,

  Save,

  X,

} from 'lucide-react';

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

  if (typeof data === 'string') return data;

  if (data?.message) return data.message;

  if (data?.title) return data.title;

  if (data?.errors) return Object.values(data.errors).flat().join(' ');

  return fallback;

}



function validateForm(form) {

  const latitude = Number(form.latitude);

  const longitude = Number(form.longitude);

  const capacityKWh = Number(form.capacityKWh);

  const batterySlots = Number(form.batterySlots);



  if (!form.name.trim()) return 'Node name is required.';

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {

    return 'Latitude must be between -90 and 90.';

  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {

    return 'Longitude must be between -180 and 180.';

  }

  if (!Number.isFinite(capacityKWh) || capacityKWh <= 0) {

    return 'Capacity must be greater than zero.';

  }

  if (!Number.isInteger(batterySlots) || batterySlots <= 0) {

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

      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-zinc-300">

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



function SummaryCard({ icon: Icon, label, value, accent }) {

  return (

    <motion.div whileHover={{ y: -3 }} className="summary-card">

      <div className="flex items-center justify-between">

        <span className="summary-label">{label}</span>

        <span className={`summary-icon ${accent}`}>

          <Icon className="h-5 w-5" />

        </span>

      </div>

      <strong className="summary-number">{value}</strong>

    </motion.div>

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

    if (showLoader) setIsLoadingList(true);

    try {

      const response = await getNodes();

      setNodes(Array.isArray(response.data) ? response.data : []);

      setErrorMsg('');

    } catch (error) {

      setErrorMsg(

        getErrorMessage(error, 'Could not load microgrid nodes. Please check the API connection.')

      );

    } finally {

      if (showLoader) setIsLoadingList(false);

    }

  }



  function clearMessages() {

    setErrorMsg('');

    setSuccessMsg('');

  }



  function handleChange(event) {

    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));

  }



  function handleEditChange(event) {

    const { name, value } = event.target;

    setEditForm((previous) => ({ ...previous, [name]: value }));

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

      setErrorMsg(getErrorMessage(error, 'Failed to register the node.'));

    } finally {

      setIsSubmitting(false);

    }

  }



  function handleEdit(node) {

    const rowId = node.id ?? node.nodeId;

    setEditingNode({ ...node, id: rowId });

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

    if (isUpdating) return;

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

      setEditError(getErrorMessage(error, 'Failed to update the node.'));

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

      setErrorMsg(getErrorMessage(error, 'Could not deactivate the node.'));

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

      setErrorMsg(getErrorMessage(error, 'Could not reactivate the node.'));

    } finally {

      setLoadingId(null);

    }

  }



  const activeCount = nodes.filter(

    (node) => String(node.status).toLowerCase() === 'active'

  ).length;

  const inactiveCount = nodes.length - activeCount;



  return (

    <main className="dashboard-container">

      <NavigationHeader />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <span className="node-page-tag">

              <Network className="h-4 w-4" />

              Grid Operator

            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">

              Microgrid Node Management

            </h1>

            <p className="mt-2 text-sm text-zinc-400 sm:text-base">

              Register, update and control solar microgrid nodes.

            </p>

          </div>



          <button

            type="button"

            onClick={() => fetchNodes()}

            disabled={isLoadingList}

            className="secondary-btn self-start md:self-auto"

          >

            <RefreshCw className={`h-4 w-4 ${isLoadingList ? 'animate-spin' : ''}`} />

            Refresh

          </button>

        </section>



        <section className="grid gap-4 sm:grid-cols-3">

          <SummaryCard icon={Network} label="Total Nodes" value={nodes.length} accent="summary-icon-yellow" />

          <SummaryCard icon={Activity} label="Active Nodes" value={activeCount} accent="summary-icon-green" />

          <SummaryCard icon={CircleOff} label="Inactive Nodes" value={inactiveCount} accent="summary-icon-muted" />

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

              <span className="flex items-center gap-2">

                <AlertCircle className="h-5 w-5 shrink-0" />

                {errorMsg}

              </span>

              <button type="button" onClick={() => setErrorMsg('')} aria-label="Close error message">

                <X className="h-5 w-5" />

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

              <span className="flex items-center gap-2">

                <CheckCircle2 className="h-5 w-5 shrink-0" />

                {successMsg}

              </span>

              <button type="button" onClick={() => setSuccessMsg('')} aria-label="Close success message">

                <X className="h-5 w-5" />

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

            <h2 className="text-xl font-bold text-white">Register New Node</h2>

            <p className="mt-1 text-sm text-zinc-500">Enter the solar hub information below.</p>

          </div>



          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            <FormField label="Node Name" name="name" value={form.name} onChange={handleChange} placeholder="Malabe Solar Hub" required />

            <FormField label="Latitude" name="latitude" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={handleChange} placeholder="6.9147" required />

            <FormField label="Longitude" name="longitude" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={handleChange} placeholder="79.9729" required />

            <FormField label="Capacity (kWh)" name="capacityKWh" type="number" step="any" min="0.01" value={form.capacityKWh} onChange={handleChange} placeholder="500" required />

            <FormField label="Battery Slots" name="batterySlots" type="number" step="1" min="1" value={form.batterySlots} onChange={handleChange} placeholder="10" required />

            <FormField label="Operating Schedule" name="schedule" value={form.schedule} onChange={handleChange} placeholder="08:00 AM - 06:00 PM" />

          </div>



          <div className="mt-7 flex justify-end">

            <button type="submit" disabled={isSubmitting} className="primary-btn">

              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}

              {isSubmitting ? 'Registering' : 'Register Node'}

            </button>

          </div>

        </motion.form>



        <section className="node-card overflow-hidden">

          <div className="border-b border-white/[0.07] px-6 py-5">

            <h2 className="text-xl font-bold text-white">Registered Nodes</h2>

            <p className="mt-1 text-sm text-zinc-500">

              {nodes.length} microgrid node{nodes.length === 1 ? '' : 's'} registered

            </p>

          </div>



          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left">

              <thead className="node-table-head">

                <tr className="text-xs font-bold uppercase tracking-wider text-zinc-500">

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

              <tbody className="divide-y divide-white/[0.06]">

                <AnimatePresence>

                  {isLoadingList ? (

                    <tr>

                      <td colSpan={8} className="px-5 py-16 text-center">

                        <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">

                          <LoaderCircle className="h-5 w-5 animate-spin text-yellow-300" />

                          Loading nodes

                        </div>

                      </td>

                    </tr>

                  ) : nodes.length === 0 ? (

                    <tr>

                      <td colSpan={8} className="px-5 py-16 text-center text-sm text-zinc-500">

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

              <div className="flex items-start justify-between border-b border-white/[0.07] p-6">

                <div>

                  <h2 className="text-xl font-bold text-white">Edit Microgrid Node</h2>

                  <p className="mt-1 text-sm text-zinc-500">Update the selected node information.</p>

                </div>

                <button type="button" onClick={closeEditModal} disabled={isUpdating} className="modal-close" aria-label="Close edit modal">

                  <X className="h-5 w-5" />

                </button>

              </div>



              <form onSubmit={handleUpdate} className="p-6">

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <FormField label="Node Name" name="name" value={editForm.name} onChange={handleEditChange} required className="sm:col-span-2" />

                  <FormField label="Latitude" name="latitude" type="number" step="any" min="-90" max="90" value={editForm.latitude} onChange={handleEditChange} required />

                  <FormField label="Longitude" name="longitude" type="number" step="any" min="-180" max="180" value={editForm.longitude} onChange={handleEditChange} required />

                  <FormField label="Capacity (kWh)" name="capacityKWh" type="number" step="any" min="0.01" value={editForm.capacityKWh} onChange={handleEditChange} required />

                  <FormField label="Battery Slots" name="batterySlots" type="number" step="1" min="1" value={editForm.batterySlots} onChange={handleEditChange} required />

                  <FormField label="Operating Schedule" name="schedule" value={editForm.schedule} onChange={handleEditChange} placeholder="08:00 AM - 06:00 PM" className="sm:col-span-2" />

                </div>



                {editError && (

                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-300">

                    <AlertCircle className="h-5 w-5 shrink-0" />

                    {editError}

                  </div>

                )}



                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button type="button" onClick={closeEditModal} disabled={isUpdating} className="secondary-btn">

                    Cancel

                  </button>

                  <button type="submit" disabled={isUpdating} className="primary-btn">

                    {isUpdating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}

                    {isUpdating ? 'Saving' : 'Save Changes'}

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
