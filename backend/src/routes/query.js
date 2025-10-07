import express from 'express';
import {
  prepareSchemaForConnection,
  generateAndRunQuery,
  executeRawSQL
} from '../controllers/queryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Query operations
router.post('/prepare-schema', prepareSchemaForConnection);
router.post('/generate-sql', generateAndRunQuery);
router.post('/execute-sql', executeRawSQL);

export default router;
