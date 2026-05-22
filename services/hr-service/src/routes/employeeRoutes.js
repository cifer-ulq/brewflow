const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken, requireRole } = require('../middleware/auth');
const canWrite = requireRole('admin');
const canRead  = requireRole('admin');

router.get('/',        verifyToken, canRead,  employeeController.getAllEmployees);
router.get('/:id',     verifyToken, canRead,  employeeController.getEmployeeById);
router.post('/',       verifyToken, canWrite, employeeController.createEmployee);
router.put('/:id',     verifyToken, canWrite, employeeController.updateEmployee);
router.delete('/:id',  verifyToken, canWrite, employeeController.deleteEmployee);

module.exports = router;
