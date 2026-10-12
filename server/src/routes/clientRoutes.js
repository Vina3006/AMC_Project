const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  createClient,
  getClients,
  getMyClient,
  getClientById,
  updateClient,
} = require('../controllers/clientController');
 
// NOTE: '/me' must be above '/:id', otherwise Express reads "me" as an id.
router.get('/me', verifyToken, requireRole('customer'), getMyClient);
 
router.post('/', verifyToken, requireRole('admin', 'staff'), createClient);
router.get('/', verifyToken, requireRole('admin', 'staff'), getClients);
router.get('/:id', verifyToken, requireRole('admin', 'staff'), getClientById);
router.put('/:id', verifyToken, requireRole('admin', 'staff'), updateClient);
 
module.exports = router;
 