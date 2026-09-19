import api from './api';

// ─── Node API Service ─────────────────────────────────────────────────────
// All Microgrid Node Management calls go through the central C# Web API.
// No business logic here — the API decides what is allowed (e.g. blocking
// deactivation when active reservations exist).

// Fetch all microgrid nodes
export const getNodes = () => api.get('/nodes');

// Fetch a single node by id
export const getNodeById = (id) => api.get(`/nodes/${id}`);

// Register a new microgrid node
// payload: { name, latitude, longitude, capacityKWh, batterySlots, schedule }
export const createNode = (payload) => api.post('/nodes', payload);

// Update an existing node's details / schedule
export const updateNode = (id, payload) => api.put(`/nodes/${id}`, payload);

// Deactivate a node. The API itself checks for active reservations and
// returns a 409 Conflict (with a message) if deactivation is blocked.
export const deactivateNode = (id) => api.patch(`/nodes/${id}/deactivate`);

// Reactivate a previously deactivated node
export const reactivateNode = (id) => api.patch(`/nodes/${id}/reactivate`);