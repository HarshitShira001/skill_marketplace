import api from './api';

export const getSessions = () => api.get('/sessions');
export const createSession = (data) => api.post('/sessions', data);
export const updateSession = (id, data) => api.put(`/sessions/${id}`, data);
