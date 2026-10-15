const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { createMessage, getMessages, updateStatus } = require('../controllers/contactController');
 
// anyone may send a message (no login needed)
router.post('/', createMessage);
 
// only the team can read and update them
router.get('/', verifyToken, requireRole('admin', 'staff'), getMessages);
router.put('/:id/status', verifyToken, requireRole('admin', 'staff'), updateStatus);
 
module.exports = router;
