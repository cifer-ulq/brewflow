const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);
router.get('/users', verifyToken, requireRole('admin'), authController.listUsers);
router.delete('/users/:id', verifyToken, requireRole('admin'), authController.deleteUser);

module.exports = router;
