import { handleFileUpload } from '../services/uploadService.js';

/**
 * Upload file
 * POST /api/upload
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const folder = req.body.folder || 'uploads';
    const result = await handleFileUpload(req.file, folder);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    });
  }
};

/**
 * Upload multiple files
 * POST /api/upload/multiple
 */
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      });
    }

    const folder = req.body.folder || 'uploads';
    const uploadPromises = req.files.map(file => handleFileUpload(file, folder));
    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload files',
    });
  }
};
