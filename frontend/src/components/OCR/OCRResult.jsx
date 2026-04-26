import React from 'react';
import { 
  Clipboard, 
  Check, 
  MapPin, 
  Tag, 
  Users, 
  AlertCircle, 
  Rocket, 
  FileJson, 
  Text as TextIcon,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const OCRResult = ({ result, onCreateTask, isLoading }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) return null;

  const { extractedText, structuredData } = result;
  
  const priorityColors = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
  };

  const currentPriorityColor = priorityColors[structuredData?.priority?.toLowerCase()] || 'text-zinc-400 bg-zinc-800 border-zinc-700';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Raw Text Box */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col group"
        >
          <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-950 rounded-xl shadow-inner border border-zinc-800">
                <TextIcon className="w-5 h-5 text-zinc-500" />
              </div>
              <h3 className="font-black text-zinc-50 tracking-tight">Extracted Intelligence</h3>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-700 hover:border-brand-500 hover:text-brand-400 transition-all shadow-sm active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="p-8 flex-1 bg-zinc-950/30">
            <div className="h-80 overflow-y-auto pr-4 custom-scrollbar">
              <pre className="text-sm font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed selection:bg-brand-500/30 selection:text-brand-200">
                {extractedText || "No data could be decoded from the source."}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Structured Data Box */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-8 py-6 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
            <div className="p-2.5 bg-brand-500/10 rounded-xl shadow-inner border border-brand-500/20">
              <FileJson className="w-5 h-5 text-brand-500" />
            </div>
            <h3 className="font-black text-zinc-50 tracking-tight">Structured Parameters</h3>
          </div>
          <div className="p-8 space-y-8 flex-1 bg-zinc-950/30">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-brand-500/30 transition-colors group">
                <div className="flex items-center gap-2 text-zinc-500 mb-2.5">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Operation Zone</span>
                </div>
                <p className="text-zinc-100 font-bold tracking-tight">{structuredData?.location || 'Coordinate Unknown'}</p>
              </div>
              
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-brand-500/30 transition-colors group">
                <div className="flex items-center gap-2 text-zinc-500 mb-2.5">
                  <Tag className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Categorization</span>
                </div>
                <p className="text-zinc-100 font-bold tracking-tight capitalize">{structuredData?.category || 'General Mission'}</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-brand-500/30 transition-colors group">
                <div className="flex items-center gap-2 text-zinc-500 mb-2.5">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Impacted Civilians</span>
                </div>
                <p className="text-zinc-100 font-bold tracking-tight">{structuredData?.peopleAffected || 'Scale Undefined'}</p>
              </div>

              <div className={`p-5 rounded-2xl border ${currentPriorityColor} transition-all duration-300`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Mission Priority</span>
                </div>
                <p className="font-black text-xl capitalize tracking-tighter">{structuredData?.priority || 'Standard'}</p>
              </div>
            </div>

            <div className="bg-brand-500/5 rounded-2xl p-6 border border-brand-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <Sparkles className="w-16 h-16 text-brand-500" />
              </div>
              <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Mission Specification
              </h4>
              <p className="text-sm text-zinc-300 font-medium leading-relaxed relative z-10">
                {structuredData?.title || structuredData?.description || "Source data processed. System ready for mission initiation."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center pt-8"
      >
        <button
          onClick={onCreateTask}
          disabled={isLoading}
          className="group relative flex items-center justify-center min-w-[320px] gap-4 px-12 py-6 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-brand-500/20 hover:bg-brand-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          )}
          <span className="relative z-10">{isLoading ? "Deploying..." : "Launch Smart Mission"}</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

const Loader2 = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default OCRResult;
