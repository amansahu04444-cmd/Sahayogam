import React, { useState } from 'react';
import { Sparkles, ArrowLeft, History, Zap, ShieldCheck, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OCRUpload from '../components/OCR/OCRUpload';
import OCRResult from '../components/OCR/OCRResult';
import { dataAPI, taskAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const OCRProcessingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (file) => {
    setIsLoading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('autoSave', 'false');

    try {
      const response = await dataAPI.collect(formData);
      console.log('OCR + Gemini result:', response.data);
      setResult(response.data);
      toast.success('Document analyzed successfully!');
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error(error.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!result?.structuredData) return;
    
    setIsCreatingTask(true);
    try {
      const getPriorityScore = (prio) => {
        const p = String(prio || '').toLowerCase();
        if (p.includes('high') || p.includes('critical') || p.includes('urgent')) return 8;
        if (p.includes('low') || p.includes('minor')) return 2;
        return 5;
      };

      const taskLocation = typeof result.structuredData.location === 'string' 
        ? result.structuredData.location 
        : 'Unknown Location';

      const taskData = {
        title: result.structuredData.title || result.structuredData.issue || `Task from Analysis - ${new Date().toLocaleDateString()}`,
        description: result.extractedText || "Generated from Uploaded Document",
        location: { lat: 0, lng: 0, address: taskLocation },
        category: result.structuredData.category || 'General',
        peopleAffected: Number(result.structuredData.peopleAffected) || 0,
        urgency: getPriorityScore(result.structuredData.priority || result.structuredData.urgency),
        severity: getPriorityScore(result.structuredData.priority),
      };

      await taskAPI.create(taskData);
      toast.success('Mission initiated from analysis data!');
      navigate('/tasks');
    } catch (error) {
      console.error('Create Task Error:', error);
      toast.error('Deployment failed. Manual entry required.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-20">
      {/* Header */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-zinc-50 shadow-inner group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Upload Data</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Automated Intelligence</span>
                <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                <span className="text-[10px] text-brand-500 font-black uppercase tracking-[0.2em]">Vision Core active</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Encrypted</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-16">
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left side: Info */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-brand-500/10 rounded-[2rem] flex items-center justify-center border border-brand-500/20 shadow-2xl shadow-brand-500/10">
                  <Cpu className="w-8 h-8 text-brand-500" />
                </div>
                <h2 className="text-5xl font-black text-zinc-50 leading-[1.1] tracking-tighter">
                  Smart Data <br />
                  <span className="text-brand-500">Upload.</span>
                </h2>
                <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-md">
                  Upload files like reports, images, or CSV. The system will read and organize the data automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Zap, label: 'Fast Analysis', sub: 'Sub-second OCR' },
                  { icon: History, label: 'Auto-Sync', sub: 'Database Ready' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
                    <item.icon className="w-6 h-6 text-brand-500 mb-3" />
                    <p className="text-sm font-black text-zinc-100">{item.label}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Upload box */}
            <div className="lg:col-span-7">
               <OCRUpload onUpload={handleUpload} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between pb-8 border-b border-zinc-800">
               <div>
                 <h2 className="text-3xl font-black text-zinc-50 tracking-tight">Analysis Results</h2>
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Data extraction complete</p>
               </div>
               <button 
                onClick={() => setResult(null)}
                className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-50 hover:border-zinc-700 transition-all shadow-xl"
               >
                Process Another
               </button>
            </div>
            <OCRResult 
              result={result} 
              onCreateTask={handleCreateTask} 
              isLoading={isCreatingTask} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRProcessingPage;
