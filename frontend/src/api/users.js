import api from './index';

export const getUsers    = ()           => api.get('/auth/users');
export const createUser  = (data)       => api.post('/auth/register', data);
export const deleteUser  = (id)         => api.delete(`/auth/users/${id}`);
