const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getUsers, updateUserRole } = require('../controllers/userController');
 
router.get('/', verifyToken, requireRole('admin'), getUsers);
router.put('/:id/role', verifyToken, requireRole('admin'), updateUserRole);
 
module.exports = router;