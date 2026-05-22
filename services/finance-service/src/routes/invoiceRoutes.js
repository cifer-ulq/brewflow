const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, requireRole } = require('../middleware/auth');
const canAccess = requireRole('admin', 'finance_officer');
const adminOnly = requireRole('admin');

router.get('/invoices',            verifyToken, canAccess, invoiceController.getAllInvoices);
router.get('/invoices/:id',        verifyToken, canAccess, invoiceController.getInvoiceById);
router.patch('/invoices/:id/status', verifyToken, adminOnly, invoiceController.updateInvoiceStatus);
router.post('/invoices', invoiceController.createInvoice); // internal call from orders-service
router.get('/summary',             verifyToken, canAccess, invoiceController.getSummary);

module.exports = router;
