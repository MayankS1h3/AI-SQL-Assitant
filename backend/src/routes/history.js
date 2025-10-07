import express from 'express';
import {
  getQueryHistory,
  getQueryById,
  deleteQueryFromHistory,
  clearQueryHistory
} from '../controllers/historyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// History operations
router.get('/', getQueryHistory);
router.get('/:id', getQueryById);
router.delete('/:id', deleteQueryFromHistory);
router.delete('/', clearQueryHistory);

export default router;
