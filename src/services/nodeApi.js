import api from './api';

export const getNodes = () => api.get('/microgridnodes');

export const getNodeById = (id) => api.get(`/microgridnodes/${id}`);

export const createNode = (payload) =>
  api.post('/microgridnodes', payload);

export const updateNode = (id, payload) =>
  api.put(`/microgridnodes/${id}`, payload);

export const deactivateNode = (id) =>
  api.patch(`/microgridnodes/${id}/deactivate`);

export const reactivateNode = (id) =>
  api.patch(`/microgridnodes/${id}/reactivate`);