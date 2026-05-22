const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { verifyToken, requireRole } = require('../middleware/auth');
const canWrite = requireRole('admin');
const canRead  = requireRole('admin', 'cashier');

router.get('/',          verifyToken, canRead,  itemController.getAllItems);
router.get('/:id',       verifyToken, canRead,  itemController.getItemById);
router.post('/',         verifyToken, canWrite, itemController.createItem);
router.put('/:id',       verifyToken, canWrite, itemController.updateItem);
router.delete('/:id',    verifyToken, canWrite, itemController.deleteItem);
router.patch('/:id/deduct', verifyToken, canWrite, itemController.deductStock);

module.exports = router;
