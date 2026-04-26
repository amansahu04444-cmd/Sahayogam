import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { performOCR, saveTempFile, cleanupTempFile } from '../services/ocrService.js';
import { parseTextToStructuredData, parseCSVRow } from '../services/parsingService.js';
import { processWithGemini } from '../services/geminiService.js';
import { db } from '../config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Save data to Firestore tasks collection
 */
const saveTaskToFirestore = async (taskData) => {
  const task = {
    ...taskData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection('tasks').add(task);
  return { id: docRef.id, ...task };
};

/**
 * Check for hotspot detection (repeated issues at same location)
 */
const checkHotspot = async (location) => {
  if (!location) return false;

  try {
    const snapshot = await db.collection('tasks')
      .where('location', '==', location)
      .where('status', '==', 'pending')
      .limit(3)
      .get();

    return snapshot.size >= 2; // 2+ pending tasks at same location = hotspot
  } catch (e) {
    return false;
  }
};

/**
 * Process single image/PDF file through OCR → Parse → Save
 */
const processFile = async (file, autoSave = true) => {
  let tempFilePath = null;

  try {
    console.log(`\n📁 Processing file: ${file.originalname}`);
    console.log(`   Type: ${file.mimetype}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);

    // Save buffer to temp file for OCR
    tempFilePath = saveTempFile(file.buffer, file.originalname);

    // Perform OCR
    const rawText = await performOCR(tempFilePath, file.mimetype);

    if (!rawText || rawText.trim().length < 10) {
      console.log('⚠️ OCR produced minimal text, using fallback');
    }

    // Parse to structured data
    let structuredData;
    try {
      console.log('🤖 Processing extracted text with Gemini AI...');
      console.log('OCR TEXT:', rawText);
      structuredData = await processWithGemini(rawText);
      console.log('GEMINI OUTPUT:', JSON.stringify(structuredData, null, 2));
      
      // Ensure specific string cases match existing models
      if (structuredData.priority) structuredData.priority = structuredData.priority.toLowerCase();
      if (structuredData.category) structuredData.category = structuredData.category.toLowerCase();
      
      // Default to null if not provided or correctly inferred
      structuredData.latitude = structuredData.latitude || null;
      structuredData.longitude = structuredData.longitude || null;
    } catch (aiError) {
      console.error('⚠️ Gemini AI processing failed, falling back to basic parsing:', aiError.message);
      structuredData = parseTextToStructuredData(rawText);
      console.log('FALLBACK OUTPUT:', JSON.stringify(structuredData, null, 2));
    }

    // Check for hotspot
    if (structuredData.location) {
      structuredData.hotspot = await checkHotspot(structuredData.location);
    }

    console.log(`   📍 Location: ${structuredData.location || 'N/A'}`);
    console.log(`   🏷️  Category: ${structuredData.category}`);
    console.log(`   👥 People: ${structuredData.peopleAffected || 'N/A'}`);
    console.log(`   ⚡ Priority: ${structuredData.priority}`);

    // Save to Firestore if autoSave is true
    let saved = null;
    if (autoSave) {
      saved = await saveTaskToFirestore(structuredData);
      console.log(`   ✅ Saved to Firestore: ${saved.id}`);
    }

    return {
      fileName: file.originalname,
      extractedText: rawText,
      structuredData,
      saved: autoSave,
      id: saved ? saved.id : null,
    };

  } catch (error) {
    console.error(`❌ Error processing ${file.originalname}:`, error.message);
    return {
      fileName: file.originalname,
      extractedText: '',
      structuredData: null,
      saved: false,
      error: error.message,
    };
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
};

/**
 * Process CSV file - bulk import
 */
const processCSV = async (file, autoSave = true) => {
  const results = [];
  const errors = [];

  return new Promise((resolve) => {
    const stream = csvParser();
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(chunk));

    stream.on('end', async () => {
      try {
        // Parse CSV manually from buffer
        const csvText = file.buffer.toString('utf-8');
        const lines = csvText.split('\n').filter(l => l.trim());

        if (lines.length < 2) {
          resolve({ error: 'CSV must have header + at least 1 data row' });
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });

          try {
            const taskData = parseCSVRow(row);

            // Check hotspot
            if (taskData.location) {
              taskData.hotspot = await checkHotspot(taskData.location);
            }

            let savedId = null;
            if (autoSave) {
              const saved = await saveTaskToFirestore(taskData);
              savedId = saved.id;
            }
            results.push({ row: i + 1, id: savedId, ...taskData });
          } catch (e) {
            errors.push({ row: i + 1, error: e.message });
          }
        }

        console.log(`\n📊 CSV Import: ${results.length} succeeded, ${errors.length} failed`);
        resolve({
          total: results.length + errors.length,
          succeeded: results.length,
          failed: errors.length,
          tasks: results,
          errors: errors.slice(0, 10), // Limit error details
        });

      } catch (e) {
        resolve({ error: `CSV parsing failed: ${e.message}` });
      }
    });

    stream.on('error', (e) => {
      resolve({ error: `CSV stream error: ${e.message}` });
    });

    // Write buffer to stream
    const readable = Readable.from(file.buffer);
    readable.pipe(stream);
  });
};

/**
 * POST /api/data/collect
 * Main endpoint: Upload → OCR → Parse → Save
 */
export const collectData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Send file via "file" form field.',
      });
    }

    console.log("File received:", req.file.originalname, req.file.mimetype, req.file.size);

    const { mimetype, originalname } = req.file;

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'text/csv',
    ];

    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed: JPG, PNG, GIF, PDF, CSV',
      });
    }

    let result;
    const autoSave = req.body.autoSave !== 'false'; // Defaults to true unless explicitly disabled

    if (mimetype === 'text/csv') {
      // CSV bulk import
      console.log('\n📊 Processing CSV file...');
      result = await processCSV(req.file, autoSave);

      if (result.error) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.json({
        success: true,
        type: 'csv',
        saved: true,
        ...result,
      });

    } else {
      // Image/PDF - OCR pipeline
      result = await processFile(req.file, autoSave);

      if (autoSave && !result.saved) {
        return res.status(500).json({
          success: false,
          message: `Processing failed: ${result.error}`,
        });
      }

      return res.json({
        success: true,
        type: 'ocr',
        extractedText: result.extractedText,
        structuredData: result.structuredData,
        saved: result.saved,
        id: result.id,
      });
    }

  } catch (error) {
    console.error('❌ Data collection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process file',
    });
  }
};

/**
 * POST /api/data/collect/bulk
 * Process multiple files
 */
export const collectBulkData = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      });
    }

    const autoSave = req.body.autoSave !== 'false';
    const results = [];
    for (const file of req.files) {
      const result = await processFile(file, autoSave);
      results.push(result);
    }

    const succeeded = results.filter(r => r.saved).length;
    const failed = results.filter(r => !r.saved).length;

    res.json({
      success: true,
      total: results.length,
      succeeded,
      failed,
      results,
    });

  } catch (error) {
    console.error('❌ Bulk collection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Bulk processing failed',
    });
  }
};

/**
 * POST /api/data/parse-text
 * Parse raw text without file upload (for manual entry)
 */
export const parseText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 10 characters',
      });
    }

    const structuredData = parseTextToStructuredData(text);

    res.json({
      success: true,
      rawText: text,
      structuredData,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Parsing failed',
    });
  }
};

export default {
  collectData,
  collectBulkData,
  parseText,
};