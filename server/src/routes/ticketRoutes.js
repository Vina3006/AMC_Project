const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  createTicket,
  getTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  getAssetHistory,
  getTechnicians,
} = require('../controllers/ticketController');
 
// Fixed-word paths must come BEFORE '/:id', or Express reads the word as an id.
router.get('/technicians', verifyToken, requireRole('admin', 'staff'), getTechnicians);
router.get('/asset/:assetId', verifyToken, requireRole('admin', 'staff', 'technician', 'customer'), getAssetHistory);
 
router.post('/', verifyToken, requireRole('customer', 'admin', 'staff'), createTicket);
router.get('/', verifyToken, requireRole('admin', 'staff', 'technician', 'customer'), getTickets);
router.get('/:id', verifyToken, requireRole('admin', 'staff', 'technician', 'customer'), getTicketById);
 
router.put('/:id/assign', verifyToken, requireRole('admin', 'staff'), assignTicket);
router.put('/:id/status', verifyToken, requireRole('admin', 'staff', 'technician', 'customer'), updateTicketStatus);
 
module.exports = router;
 