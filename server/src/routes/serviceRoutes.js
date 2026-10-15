const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  getServices,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  setServiceActive,
} = require('../controllers/serviceController');
 
// public: anyone can see the services
router.get('/', getServices);
 
// admin only (this path must come before '/:id')
router.get('/manage/all', verifyToken, requireRole('admin'), getAllServices);
 
router.get('/:id', getServiceById);
 
router.post('/', verifyToken, requireRole('admin'), createService);
router.put('/:id', verifyToken, requireRole('admin'), updateService);
router.put('/:id/active', verifyToken, requireRole('admin'), setServiceActive);
 
module.exports = router;
 