const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
} = require('../controllers/assetController');
 
router.post('/', verifyToken, requireRole('admin', 'staff'), createAsset);
 
// admin, staff and customer can list; the controller filters by role
router.get('/', verifyToken, requireRole('admin', 'staff', 'customer'), getAssets);
router.get('/:id', verifyToken, requireRole('admin', 'staff', 'technician', 'customer'), getAssetById);
 
router.put('/:id', verifyToken, requireRole('admin', 'staff'), updateAsset);
 
module.exports = router;
 