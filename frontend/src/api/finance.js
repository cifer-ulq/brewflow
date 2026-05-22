import api from './index';
export const getInvoices          = ()           => api.get('/finance/invoices');
export const getSummary           = ()           => api.get('/finance/summary');
export const updateInvoiceStatus  = (id, status) => api.patch(`/finance/invoices/${id}/status`, { status });
