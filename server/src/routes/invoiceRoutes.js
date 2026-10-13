const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  payInvoice,
} = require('../controllers/invoiceController');
 
router.post('/', verifyToken, requireRole('admin', 'staff'), createInvoice);
router.get('/', verifyToken, requireRole('admin', 'staff', 'customer'), getInvoices);
router.get('/:id', verifyToken, requireRole('admin', 'staff', 'customer'), getInvoiceById);
router.post('/:id/pay', verifyToken, requireRole('customer'), payInvoice);
 
module.exports = router;
