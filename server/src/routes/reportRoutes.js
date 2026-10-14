const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getReport } = require('../controllers/reportController');
 
// Only the people who run the business can see reports.
router.get('/', verifyToken, requireRole('admin', 'staff'), getReport);
 
module.exports = router;
 
