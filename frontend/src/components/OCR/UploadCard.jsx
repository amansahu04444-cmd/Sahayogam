import React from 'react';
import { UploadCloud, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadCard = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/ocr')}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 active:scale-[0.98]"
    >
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-brand-500/10 transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-zinc-800/20 blur-[40px] rounded-full -ml-12 -mb-12" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:border-brand-500/30 transition-all duration-500">
            <UploadCloud className="w-7 h-7 text-brand-400 group-hover:text-brand-300 transition-colors" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <ArrowRight className="w-5 h-5 text-brand-500 translate-x-[-10px] group-hover:translate-x-0 transition-transform duration-500" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-zinc-50 tracking-tight mb-2">
            Upload Data
          </h3>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[200px]">
            Upload reports, images, or CSV files for automated task processing.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">JPG</div>
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">PDF</div>
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">CSV</div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-brand-500 transition-colors">
            Supported Formats
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadCard;
