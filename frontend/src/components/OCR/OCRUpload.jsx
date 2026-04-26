import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertTriangle, Loader2, X, CheckCircle2, FileUp, ImageIcon, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OCRUpload = ({ onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/csv'];
    const isCSV = selectedFile.name.endsWith('.csv');

    if (!allowedTypes.includes(selectedFile.type) && !isCSV) {
      setError('Unsupported format. Use Images, PDF, or CSV.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-brand-400" />;
    if (file.type === 'application/pdf') return <FileText className="w-8 h-8 text-red-400" />;
    if (file.name.endsWith('.csv')) return <FileCode className="w-8 h-8 text-green-400" />;
    return <FileText className="w-8 h-8 text-zinc-400" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); validateAndSetFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current.click()}
            className={`relative group cursor-pointer transition-all duration-500 border-2 border-dashed rounded-[2.5rem] p-12 text-center h-[350px] flex flex-col items-center justify-center overflow-hidden ${
              isDragging 
                ? 'border-brand-500 bg-brand-500/5 shadow-2xl shadow-brand-500/10' 
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 shadow-sm'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.csv"
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,184,166,0.03),transparent)] pointer-events-none" />
            
            <div className="relative mb-6">
               <div className="w-20 h-20 bg-zinc-950 rounded-2xl shadow-inner flex items-center justify-center border border-zinc-800 group-hover:scale-110 group-hover:border-brand-500/50 transition-all duration-500">
                <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-brand-500 animate-bounce' : 'text-zinc-600 group-hover:text-brand-400'}`} />
              </div>
            </div>

            <h3 className="text-xl font-black text-zinc-50 mb-2 tracking-tight">
              Drag files here
            </h3>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-8">
              or click to upload
            </p>
            
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
               <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-brand-500" /> Auto Data Reading</span>
               <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-brand-500" /> Secure Upload</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview-zone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-inner">
                  {getFileIcon(file)}
                </div>
                <div>
                  <h4 className="text-zinc-50 font-black tracking-tight truncate max-w-[200px]">
                    {file.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="p-3 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => onUpload(file)}
                disabled={isLoading}
                className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    Begin Analysis
                    <FileUp className="w-6 h-6" />
                  </>
                )}
              </button>
              
              {!isLoading && (
                <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  AI will extract mission parameters automatically
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl"
        >
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-tight">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

export default OCRUpload;
