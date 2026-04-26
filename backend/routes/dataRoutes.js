import express from 'express';
import multer from 'multer';
import * as dataCollectionController from '../controllers/dataCollectionController.js';

const router = express.Router();

// Configure multer for memory storage (we process buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, PDF, CSV'), false);
    }
  },
});

/**
 * POST /api/data/collect
 * Upload file → OCR → Parse → Save to Firestore
 *
 * Supports: JPG, PNG, GIF, PDF, CSV
 *
 * Response:
 * {
 *   success: true,
 *   type: 'ocr' | 'csv',
 *   extractedText: '...', (for images)
 *   structuredData: {...},
 *   saved: true,
 *   id: 'firestore-doc-id'
 * }
 */
router.post('/collect', upload.single('file'), dataCollectionController.collectData);

/**
 * POST /api/data/collect/bulk
 * Process multiple files
 */
router.post('/collect/bulk', upload.array('files', 10), dataCollectionController.collectBulkData);

/**
 * POST /api/data/parse-text
 * Parse raw text to structured JSON (no file, manual entry)
 */
router.post('/parse-text', dataCollectionController.parseText);

export default router;