const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { payForService, getMyInvoices } = require('../controllers/paymentController');

router.post('/pay', verifyToken, payForService);
router.get('/my-invoices', verifyToken, getMyInvoices);

module.exports = router;