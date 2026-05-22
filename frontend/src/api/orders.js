import api from './index';
export const getOrders        = ()           => api.get('/orders');
export const getOrder         = (id)         => api.get(`/orders/${id}`);
export const createOrder      = (data)       => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const getOrderStats    = ()           => api.get('/orders/stats');
