const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/dashboardController');
 
// every logged-in role gets its own numbers from the same URL
router.get('/', verifyToken, getDashboard);
 
module.exports = router;
