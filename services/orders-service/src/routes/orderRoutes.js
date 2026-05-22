const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middleware/auth');
const canWrite = requireRole('admin', 'cashier');
const canRead  = requireRole('admin', 'cashier', 'finance_officer');

router.get('/stats',       verifyToken, requireRole('admin'), orderController.getStats);
router.get('/',            verifyToken, canRead,  orderController.getAllOrders);
router.get('/:id',         verifyToken, canRead,  orderController.getOrderById);
router.post('/',           verifyToken, canWrite, orderController.createOrder);
router.patch('/:id/status',verifyToken, canWrite, orderController.updateOrderStatus);

module.exports = router;
