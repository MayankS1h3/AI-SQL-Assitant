import express from 'express';
import {
  addConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection
} from '../controllers/connectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Connection CRUD operations
router.post('/add', addConnection);
router.get('/', getConnections);
router.get('/:id', getConnection);
router.put('/:id', updateConnection);
router.delete('/:id', deleteConnection);

export default router;
