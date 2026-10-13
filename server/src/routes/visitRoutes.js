const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { scheduleVisit, completeVisit, getVisits } = require('../controllers/visitController');
 
router.post('/', verifyToken, requireRole('admin', 'staff', 'technician'), scheduleVisit);
router.get('/', verifyToken, requireRole('admin', 'staff', 'technician', 'customer'), getVisits);
router.put('/:id/complete', verifyToken, requireRole('admin', 'staff', 'technician'), completeVisit);
 
module.exports = router;
