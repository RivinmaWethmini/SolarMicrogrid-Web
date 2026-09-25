import api from './api';

export const getNodes = () =>
  api.get('/nodes');

export const getNodeById = (id) =>
  api.get(`/nodes/${id}`);

export const createNode = (payload) =>
  api.post('/nodes', payload);

export const updateNode = (id, payload) =>
  api.put(`/nodes/${id}`, payload);

export const deactivateNode = (id) =>
  api.patch(`/nodes/${id}/deactivate`);

export const reactivateNode = (id) =>
  api.patch(`/nodes/${id}/reactivate`);