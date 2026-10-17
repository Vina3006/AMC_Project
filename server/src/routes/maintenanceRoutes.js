const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getSchedules, getRuns, runNow, setPaused } = require('../controllers/maintenanceController');
 
router.get('/schedules', verifyToken, requireRole('admin', 'staff'), getSchedules);
router.get('/runs', verifyToken, requireRole('admin', 'staff'), getRuns);
 
// only the admin may start a run or pause a schedule
router.post('/run', verifyToken, requireRole('admin'), runNow);
router.put('/schedules/:contractId', verifyToken, requireRole('admin'), setPaused);
 
module.exports = router;
 
