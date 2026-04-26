import express from 'express';
import { body } from 'express-validator';
import * as uploadController from '../controllers/uploadController.js';
import * as dataCollectionController from '../controllers/dataCollectionController.js';
import { upload } from '../services/uploadService.js';

const router = express.Router();

// Single file upload
router.post(
  '/',
  upload.single('file'),
  [
    body('folder').optional().isString(),
  ],
  dataCollectionController.collectData
);

// Multiple files upload
router.post(
  '/multiple',
  upload.array('files', 10),
  [
    body('folder').optional().isString(),
  ],
  uploadController.uploadMultipleFiles
);

export default router;
