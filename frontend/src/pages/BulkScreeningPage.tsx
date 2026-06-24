import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Files, 
  Trash2, 
  Play, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Award 
} from 'lucide-react';
import { apiService, BulkScreenCandidateResult } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const BulkScreeningPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkScreenCandidateResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addValidFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addValidFiles(Array.from(e.target.files));
    }
  };

  const addValidFiles = (incomingFiles: File[]) => {
    const valid = incomingFiles.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx';
    });

    if (valid.length !== incomingFiles.length) {
      setError("Some uploaded files were skipped. Only PDF and DOCX formats are supported.");
    } else {
      setError(null);
    }

    setFiles(prev => {
      // Avoid duplicate filename additions
      const existingNames = new Set(prev.map(f => f.name));
      const filteredNew = valid.filter(f => !existingNames.has(f.name));
      return [...prev, ...filteredNew];
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearQueue = () => {
    setFiles([]);
    setError(null);
    setResults([]);
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRunScreening = async () => {
    if (files.length === 0 || !jdText.trim()) {
      setError("Please add at least one resume and input a job description.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await apiService.bulkScreen(files, jdText);
      setResults(response.results);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || "Bulk screening failed. Check backend endpoint accessibility.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    
    // Define headers
    const headers = ["Rank", "Candidate Name", "Filename", "Match Score (%)", "Recommendation", "Matched Skills", "Missing Skills", "Summary"];
    
    // Map rows
    const rows = results.map((cand, idx) => [
      idx + 1,
      cand.candidate_name,
      cand.filename,
      cand.match_score,
      cand.recommendation,
      `"${cand.matched_skills.join(', ')}"`,
      `"${cand.missing_skills.join(', ')}"`,
      `"${cand.ai_summary.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create download element
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SmartHire_Screening_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sans">Async Bulk Screening</h1>
        <p className="text-xs sm:text-sm text-slate-400">Queue multiple applicant CVs concurrently to perform batch matching and candidate score rank.</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-4 rounded-2xl mb-8 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Execution Warning</h4>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Inputs Panels */}
      {results.length === 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Files List Queue */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Files className="h-5 w-5 text-violet-400" />
                  Candidate Queue ({files.length})
                </h2>
                {files.length > 0 && (
                  <button 
                    onClick={clearQueue}
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerUploadClick}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center min-h-[140px] mb-4 ${
                  dragActive 
                    ? 'border-violet-450 bg-violet-600/5' 
                    : 'border-white/10 hover:border-violet-500/40 hover:bg-white/2'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
                <Upload className="h-6 w-6 text-violet-400 mb-2" />
                <p className="font-bold text-xs sm:text-sm text-slate-300">Drag & drop files here, or <span className="text-violet-400">browse</span></p>
                <p className="text-[10px] text-slate-500 mt-1">PDF / DOCX formats, select multiple files</p>
              </div>

              {/* List of files */}
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                {files.map((f, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white/2 border border-white/5 px-3 py-2 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 max-w-[80%]">
                      <div className="p-1.5 bg-violet-950/20 text-violet-300 rounded-lg">
                        <Files className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-slate-200 font-medium">{f.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-slate-500 hover:text-red-400 transition p-1"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
                
                {files.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No candidates queued. Please select or drop files above.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Description Text Area */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex-grow flex flex-col mb-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-400" />
                Job Requirements Specification
              </h2>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job description requirements, responsibilities, and skill matrices here..."
                className="w-full flex-grow bg-dark-950/60 border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition min-h-[160px] resize-none"
              />
            </div>

            <button
              onClick={handleRunScreening}
              disabled={files.length === 0 || !jdText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition shadow-neon text-sm disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Execute Async Screening ({files.length} Candidates)
            </button>
          </div>
        </div>
      )}

      {/* Processing Loader */}
      {loading && (
        <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
          <LoadingSpinner size="lg" message="Screening candidate pool concurrently. Extrapolating text structures and invoking AI evaluations..." />
          <div className="max-w-md mx-auto mt-6">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
              {/* Fake animated progress status bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-teal-400 to-indigo-500 h-full rounded-full animate-gradient-bg-animate" style={{ width: '100%' }} />
            </div>
            <span className="block text-[11px] text-slate-400 uppercase font-bold tracking-widest mt-2 animate-pulse">Running concurrency checks via Python asyncio</span>
          </div>
        </div>
      )}

      {/* Screened Leaderboard Results */}
      {results.length > 0 && (
        <div className="glass-panel rounded-3xl overflow-hidden border border-violet-500/10 shadow-neon">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <Award className="h-5 w-5 text-violet-400" />
                Scoreboard Ranking
              </h2>
              <p className="text-xs text-slate-400">Candidates sorted by score match index compatibility.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-300 bg-teal-950/30 hover:bg-teal-900/30 border border-teal-500/20 rounded-xl transition"
              >
                <Download className="h-4 w-4" />
                Export to CSV
              </button>
              <button
                onClick={clearQueue}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition"
              >
                Screen New Batch
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/2 border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-5 text-center w-16">Rank</th>
                  <th className="p-5">Candidate Name</th>
                  <th className="p-5">Filename</th>
                  <th className="p-5">Match Score</th>
                  <th className="p-5">Recommendation</th>
                  <th className="p-5">AI Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                {results.map((cand, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr 
                      key={idx}
                      className="hover:bg-white/2 transition"
                    >
                      <td className="p-5 text-center font-bold text-slate-400">
                        {rank === 1 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center bg-amber-500/25 border border-amber-500/20 text-amber-300 rounded-full font-black text-xs">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center bg-slate-400/25 border border-slate-450/20 text-slate-300 rounded-full font-black text-xs">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center bg-amber-700/25 border border-amber-700/20 text-amber-500 rounded-full font-black text-xs">
                            🥉
                          </span>
                        ) : rank}
                      </td>
                      <td className="p-5 font-bold text-white">
                        {cand.candidate_name}
                      </td>
                      <td className="p-5 text-slate-400 max-w-[140px] truncate">
                        {cand.filename}
                      </td>
                      <td className="p-5 font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                cand.match_score >= 80 ? 'bg-emerald-500' : cand.match_score >= 60 ? 'bg-teal-400' : cand.match_score >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                              }`}
                              style={{ width: `${cand.match_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-extrabold">{cand.match_score}%</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                          cand.recommendation.toLowerCase().includes('strong') 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
                            : cand.recommendation.toLowerCase().includes('hire')
                            ? 'bg-teal-950/40 text-teal-300 border-teal-500/20'
                            : cand.recommendation.toLowerCase().includes('maybe')
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                            : 'bg-rose-950/40 text-rose-450 border-rose-500/20'
                        }`}>
                          {cand.recommendation}
                        </span>
                      </td>
                      <td className="p-5 text-slate-400 text-xs leading-relaxed max-w-[280px]">
                        {cand.ai_summary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default BulkScreeningPage;
