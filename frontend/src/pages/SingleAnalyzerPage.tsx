import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Check, 
  X, 
  Brain, 
  Map, 
  ChevronDown, 
  ChevronUp, 
  FolderCheck,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiService, AnalyzeResponse, RoadmapResponse, HistoryItem } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface SingleAnalyzerPageProps {
  selectedHistoryItem: HistoryItem | null;
  setSelectedHistoryItem: (item: HistoryItem | null) => void;
  setCurrentPage: (page: string) => void;
  setRoadmapPrefill?: (prefill: { skills: string[], role: string }) => void;
}

export const SingleAnalyzerPage: React.FC<SingleAnalyzerPageProps> = ({
  selectedHistoryItem,
  setSelectedHistoryItem,
  setCurrentPage,
  setRoadmapPrefill
}) => {
  // Parsing states
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedText, setParsedText] = useState('');
  const [parsedFilename, setParsedFilename] = useState('');
  
  // Input states
  const [jdText, setJdText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  
  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Roadmap states
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [openRoadmapMilestone, setOpenRoadmapMilestone] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If a history item was selected from the dashboard, prefill it!
  useEffect(() => {
    if (selectedHistoryItem) {
      setResults({
        match_score: selectedHistoryItem.match_score,
        matched_skills: selectedHistoryItem.matched_skills,
        missing_skills: selectedHistoryItem.missing_skills,
        strengths: ["High compatibility based on historical screening profile"],
        weaknesses: ["Profile review recommended to determine latest achievements"],
        recommendation: selectedHistoryItem.recommendation as any,
        ai_summary: selectedHistoryItem.ai_summary
      });
      setParsedFilename(selectedHistoryItem.filename);
      setParsedText("Resume text loaded from Firestore...");
      // Cleanup prefill so if they reload they can run fresh upload
      setSelectedHistoryItem(null);
    }
  }, [selectedHistoryItem]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileProcess(e.target.files[0]);
    }
  };

  const handleFileProcess = async (uploadedFile: File) => {
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError("Please upload only PDF or DOCX file formats.");
      return;
    }
    setError(null);
    setFile(uploadedFile);
    setParsing(true);
    setResults(null);
    setRoadmap(null);

    try {
      const response = await apiService.uploadResume(uploadedFile);
      setParsedText(response.extracted_text);
      setParsedFilename(response.filename);
      // Clean up target role suggestion
      const nameWithoutExt = response.filename.split('.')[0].toLowerCase();
      if (nameWithoutExt.includes('frontend')) setTargetRole('Frontend Engineer');
      else if (nameWithoutExt.includes('backend')) setTargetRole('Backend Engineer');
      else if (nameWithoutExt.includes('data')) setTargetRole('Data Scientist');
      else if (nameWithoutExt.includes('ai')) setTargetRole('AI Engineer');
      else setTargetRole('Full Stack Developer');
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || "Failed to parse resume document. Backend might be offline.");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!parsedText || !jdText.trim()) {
      setError("Please upload a resume and insert a job description first.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResults(null);
    setRoadmap(null);

    try {
      const response = await apiService.analyzeResume(parsedText, jdText);
      setResults(response);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || "AI analysis failed. Please verify API configurations.");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateRoadmapInline = async () => {
    if (!results || !targetRole.trim()) return;
    setLoadingRoadmap(true);
    try {
      const skills = results.missing_skills.length > 0 ? results.missing_skills : results.matched_skills;
      const response = await apiService.generateRoadmap(skills, targetRole);
      setRoadmap(response);
      setOpenRoadmapMilestone(1);
    } catch (e: any) {
      console.error(e);
      setError("Failed to generate career roadmap. Backend might be offline.");
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const routeToDetailedRoadmap = () => {
    if (results && setRoadmapPrefill) {
      setRoadmapPrefill({
        skills: results.missing_skills.length > 0 ? results.missing_skills : results.matched_skills,
        role: targetRole || "Software Engineer"
      });
      setCurrentPage('career');
    }
  };

  // SVG parameters for match score circular progress chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = results ? circumference - (results.match_score / 100) * circumference : circumference;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sans">Single Resume Analyzer</h1>
        <p className="text-xs sm:text-sm text-slate-400">Perform deep intelligence mapping on an applicant resume against role objectives.</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-4 rounded-2xl mb-8 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error Encountered</h4>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Main Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Left Panel: Resume Upload Zone */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-400" />
              1. Upload Resume
            </h2>
            
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerUploadClick}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center min-h-[220px] ${
                dragActive 
                  ? 'border-violet-450 bg-violet-600/5' 
                  : file 
                  ? 'border-emerald-500/35 bg-emerald-550/2'
                  : 'border-white/10 hover:border-violet-500/40 hover:bg-white/2'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
              
              {parsing ? (
                <LoadingSpinner message="Extracting text structure..." />
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-emerald-950/40 text-emerald-400 rounded-full border border-emerald-500/20 shadow-neon-teal">
                    <FolderCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-100 max-w-[280px] truncate">{parsedFilename}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ready for screening analysis • {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setParsedText('');
                      setResults(null);
                    }}
                    className="mt-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1 bg-red-950/20 rounded-lg hover:bg-red-900/20 transition"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-violet-950/30 text-violet-400 rounded-full border border-white/5 mb-4 group-hover:scale-105 transition">
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="font-bold text-sm text-slate-200">Drag & drop resume here, or <span className="text-violet-450">browse files</span></p>
                  <p className="text-[10px] text-slate-500 mt-2">Accepts PDF or DOCX formats up to 10 MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Text preview if uploaded */}
          {parsedText && (
            <div className="mt-6">
              <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Extracted Text Preview</span>
              <div className="bg-dark-950/70 border border-white/5 rounded-xl p-4 max-h-[140px] overflow-y-auto text-xs font-mono text-slate-400 select-none">
                {parsedText.slice(0, 800)}...
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Job Description Input */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex-grow flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-400" />
              2. Target Role & job specification
            </h2>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Role Profile</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend React Engineer"
                className="w-full bg-dark-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition"
              />
            </div>

            <div className="flex-grow flex flex-col mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job Description Specifications</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job description requirements, responsibilities, and skill matrices here..."
                className="w-full flex-grow bg-dark-950/60 border border-white/10 rounded-xl p-4 text-sm text-slate-150 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition min-h-[180px] resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || parsing || !parsedText || !jdText.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition duration-200 shadow-neon text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" message="" /> Analyzing Candidate Fit...
              </span>
            ) : (
              "Analyze Candidate Alignment"
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {results && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl mb-8 border border-violet-500/10 shadow-neon">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start border-b border-white/5 pb-8 mb-8">
            
            {/* SVG Circular Chart for Match Score */}
            <div className="relative flex items-center justify-center h-36 w-36 shrink-0 bg-dark-950/40 rounded-full border border-white/5">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-violet-500 text-glow-purple transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold font-sans text-white">{results.match_score}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Match Index</span>
              </div>
            </div>

            {/* AI Summary and Recommendation Badge */}
            <div className="text-center lg:text-left flex-grow">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3 justify-center lg:justify-start">
                <h2 className="text-xl sm:text-2xl font-bold">Screening Report</h2>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border shadow-md animate-pulse ${
                  results.recommendation.toLowerCase().includes('strong') 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 shadow-emerald-900/10' 
                    : results.recommendation.toLowerCase().includes('hire')
                    ? 'bg-teal-950/40 text-teal-300 border-teal-500/20 shadow-teal-900/10'
                    : results.recommendation.toLowerCase().includes('maybe')
                    ? 'bg-amber-950/40 text-amber-400 border-amber-500/20 shadow-amber-900/10'
                    : 'bg-rose-950/40 text-rose-450 border-rose-500/20 shadow-rose-900/10'
                }`}>
                  {results.recommendation}
                </span>
              </div>
              
              <p className="text-slate-350 text-sm sm:text-base leading-relaxed mb-6">
                {results.ai_summary}
              </p>

              {/* Skills Tags Mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Matched skills */}
                <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4">
                  <span className="block text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-4 w-4 bg-emerald-900/40 p-0.5 rounded-full" />
                    Matched Skills ({results.matched_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {results.matched_skills.map((skill, index) => (
                      <span key={index} className="px-2.5 py-1 bg-emerald-950/30 text-xs text-emerald-350 rounded-lg border border-emerald-500/15">
                        {skill}
                      </span>
                    ))}
                    {results.matched_skills.length === 0 && (
                      <span className="text-xs text-slate-500">None identified in context</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="bg-red-950/10 border border-red-500/10 rounded-2xl p-4">
                  <span className="block text-xs font-bold text-red-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <X className="h-4 w-4 bg-red-900/40 p-0.5 rounded-full" />
                    Missing Skills ({results.missing_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {results.missing_skills.map((skill, index) => (
                      <span key={index} className="px-2.5 py-1 bg-red-950/30 text-xs text-red-350 rounded-lg border border-red-500/15">
                        {skill}
                      </span>
                    ))}
                    {results.missing_skills.length === 0 && (
                      <span className="text-xs text-slate-550">Fully aligned stack!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Award className="h-4 w-4 text-violet-400" /> Key Strengths
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                {results.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-3 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-teal-400" /> Areas of Improvement
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                {results.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Career Roadmap Accordion Trigger */}
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <Map className="h-5 w-5 text-pink-400" />
                  6-Month Learning Roadmap
                </h3>
                <p className="text-xs text-slate-400">Custom curriculum to acquire candidate's missing technologies.</p>
              </div>

              {!roadmap && !loadingRoadmap && (
                <button
                  onClick={generateRoadmapInline}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl hover:from-pink-500 hover:to-rose-500 shadow-neon transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Build Roadmap
                </button>
              )}
            </div>

            {loadingRoadmap && (
              <div className="py-8 bg-white/2 rounded-2xl border border-white/5">
                <LoadingSpinner message="Generating learning path milestones with Gemini model..." />
              </div>
            )}

            {roadmap && (
              <div className="space-y-3">
                {roadmap.months.map((m) => {
                  const isOpen = openRoadmapMilestone === m.month;
                  return (
                    <div 
                      key={m.month}
                      className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenRoadmapMilestone(isOpen ? null : m.month)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/2 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full bg-violet-650/30 text-violet-300 border border-violet-500/20 text-xs font-extrabold flex items-center justify-center shrink-0">
                            M{m.month}
                          </span>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Month {m.month} Focus</span>
                            <span className="text-sm font-bold text-white">{m.title}</span>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 border-t border-white/5 bg-dark-950/20 space-y-4 text-xs sm:text-sm animate-fadeIn">
                          {/* Goals */}
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Learning Objectives</span>
                            <ul className="space-y-1.5 text-slate-350">
                              {m.goals.map((g, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                                  <span>{g}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Resources */}
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Free Assets</span>
                            <div className="flex flex-wrap gap-2">
                              {m.resources.map((res, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-slate-800 text-[11px] text-slate-300 rounded border border-slate-700 font-medium">
                                  {res}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Milestone */}
                          <div className="p-3 bg-violet-950/10 border border-violet-500/10 rounded-xl">
                            <span className="block text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Demonstrable Milestone Project</span>
                            <p className="text-xs text-slate-300 font-medium">{m.milestone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={routeToDetailedRoadmap}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition"
                  >
                    View detailed roadmap timeline
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SingleAnalyzerPage;
