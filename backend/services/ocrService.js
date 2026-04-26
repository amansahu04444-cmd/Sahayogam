import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Perform OCR on image file using Tesseract.js (FREE - no paid API)
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (filePath) => {
  try {
    console.log(`🔍 Starting OCR on: ${filePath}`);

    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`   OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text.trim();
    console.log(`✅ OCR complete. Extracted ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('❌ OCR Error:', error.message);
    throw new Error(`OCR failed: ${error.message}`);
  }
};

/**
 * Extract text from PDF (first page as image fallback)
 * For PDFs, we use pdf-parse for text extraction first, fallback to image conversion
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    console.log(`📄 Processing PDF: ${filePath}`);

    // Try pdf-parse for text-based PDFs
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      if (data.text && data.text.trim().length > 50) {
        console.log(`✅ PDF text extracted (${data.text.length} chars)`);
        return data.text.trim();
      }
    } catch (e) {
      console.log('   PDF parsing incomplete, trying OCR fallback...');
    }

    // Fallback: For scanned PDFs, return message that OCR needed
    console.log('📄 PDF appears to be scanned. OCR on image-based PDF not directly supported.');
    return '[PDF requires image-based OCR processing]';
  } catch (error) {
    console.error('❌ PDF Error:', error.message);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

/**
 * Main OCR function - detects file type and routes appropriately
 * @param {string} filePath - Path to the file
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} Extracted text
 */
export const performOCR = async (filePath, mimetype) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (mimetype.startsWith('image/')) {
    return await extractTextFromImage(filePath);
  } else if (mimetype === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  } else {
    throw new Error(`Unsupported file type for OCR: ${mimetype}`);
  }
};

/**
 * Save uploaded buffer to temp file
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @returns {string} Path to saved file
 */
export const saveTempFile = (buffer, filename) => {
  const filepath = path.join(UPLOADS_DIR, `${Date.now()}-${filename}`);
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

/**
 * Cleanup temp file
 * @param {string} filePath - Path to file
 */
export const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn(`Failed to cleanup: ${filePath}`);
  }
};

export default {
  performOCR,
  extractTextFromImage,
  extractTextFromPDF,
  saveTempFile,
  cleanupTempFile,
};