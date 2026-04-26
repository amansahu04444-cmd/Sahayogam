import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { admin } from '../config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure storage
const storage = multer.memoryStorage();

// File filter (Allowed types: images, PDFs, DOCs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and DOC files are allowed.'), false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Upload file to Firebase Storage
 */
export const uploadToFirebaseStorage = async (file, folder = 'uploads') => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const bucket = admin.storage().bucket();
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        reject(new Error(`Upload failed: ${error.message}`));
      });

      blobStream.on('finish', async () => {
        // Make file publicly accessible
        await fileUpload.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        resolve({
          fileName,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: publicUrl,
        });
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Handle file upload
 * Strictly uses Firebase Storage
 */
export const handleFileUpload = async (file, folder = 'uploads') => {
  if (!file) {
    throw new Error('No file provided');
  }
  return await uploadToFirebaseStorage(file, folder);
};

/**
 * Delete file from Firebase Storage
 */
export const deleteFile = async (fileName) => {
  try {
    const bucket = admin.storage().bucket();
    await bucket.file(fileName).delete();
    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error('Failed to delete file');
  }
};
