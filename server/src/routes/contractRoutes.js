const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  createContract,
  getContracts,
  getContractById,
  updateContract,
} = require('../controllers/contractController');
 
router.post('/', verifyToken, requireRole('admin', 'staff'), createContract);
 
// the controller filters by role, so customers only see their own
router.get('/', verifyToken, requireRole('admin', 'staff', 'customer'), getContracts);
router.get('/:id', verifyToken, requireRole('admin', 'staff', 'customer'), getContractById);
 
router.put('/:id', verifyToken, requireRole('admin', 'staff'), updateContract);
 
module.exports = router;
 