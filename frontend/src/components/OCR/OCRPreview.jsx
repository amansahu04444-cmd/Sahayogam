import React from 'react';
import { FileText, X, Image as ImageIcon, FileCode } from 'lucide-react';

const OCRPreview = ({ file, onClear }) => {
  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');

  return (
    <div className="relative group bg-white p-4 rounded-2xl border-2 border-brand-100 shadow-sm transition-all hover:shadow-md">
      <button
        onClick={onClear}
        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : isPDF ? (
            <FileText className="w-8 h-8 text-brand-600" />
          ) : isCSV ? (
            <FileCode className="w-8 h-8 text-brand-600" />
          ) : (
            <FileText className="w-8 h-8 text-brand-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OCRPreview;
