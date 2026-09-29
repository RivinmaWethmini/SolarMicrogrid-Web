import api from './api';

export const getProsumers = () =>
  api.get('/prosumer');

export const getProsumerByNIC = (nic) =>
  api.get(`/prosumer/${nic}`);

export const createProsumer = (payload) =>
  api.post('/prosumer', payload);

export const updateProsumer = (nic, payload) =>
  api.put(`/prosumer/${nic}`, payload);

export const deactivateProsumer = (nic) =>
  api.patch(`/prosumer/${nic}/deactivate`);

export const reactivateProsumer = (nic) =>
  api.patch(`/prosumer/${nic}/reactivate`);

export const deleteProsumer = (nic) =>
  api.delete(`/prosumer/${nic}`);