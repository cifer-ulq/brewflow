import api from './index';
export const getEmployees = () => api.get('/hr');
export const createEmployee = (data) => api.post('/hr', data);
export const updateEmployee = (id, data) => api.put(`/hr/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/hr/${id}`);
