import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Plus, 
  X, 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  Milestone as MilestoneIcon,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { apiService, RoadmapResponse } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface CareerRoadmapPageProps {
  roadmapPrefill: { skills: string[], role: string } | null;
  setRoadmapPrefill: (prefill: null) => void;
}

export const CareerRoadmapPage: React.FC<CareerRoadmapPageProps> = ({
  roadmapPrefill,
  setRoadmapPrefill
}) => {
  // Input states
  const [skills, setSkills] = useState<string[]>(["JavaScript", "HTML", "CSS"]);
  const [skillInput, setSkillInput] = useState('');
  const [targetRole, setTargetRole] = useState('Frontend Engineer');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill hook if they routed here from analysis
  useEffect(() => {
    if (roadmapPrefill) {
      setSkills(roadmapPrefill.skills);
      setTargetRole(roadmapPrefill.role);
      // Automatically trigger roadmap generation on prefill
      generateRoadmap(roadmapPrefill.skills, roadmapPrefill.role);
      // Clean up parent prefill state
      setRoadmapPrefill(null);
    }
  }, [roadmapPrefill]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const cleanSkill = skillInput.replace(',', '').trim();
      if (cleanSkill && !skills.includes(cleanSkill)) {
        setSkills(prev => [...prev, cleanSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, idx) => idx !== index));
  };

  const generateRoadmap = async (skillsList = skills, role = targetRole) => {
    if (skillsList.length === 0 || !role.trim()) {
      setError("Please add at least one current skill and input your target role.");
      return;
    }
    setLoading(true);
    setError(null);
    setRoadmap(null);

    try {
      const data = await apiService.generateRoadmap(skillsList, role);
      setRoadmap(data);
    } catch (e: any) {
      console.error(e);
      setError("Failed to generate career intelligence roadmap. Verification checks failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sans">Career Intelligence Roadmap</h1>
        <p className="text-xs sm:text-sm text-slate-400">Generate a custom-tailored 6-month timeline to bridge tech gaps and upskill for desired MNC positions.</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-4 rounded-2xl mb-8 text-xs sm:text-sm leading-relaxed">
          {error} Verify connection endpoints.
        </div>
      )}

      {/* Input controls form */}
      {!loading && !roadmap && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-neon">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Map className="h-5 w-5 text-violet-400" />
            Define career objective
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Skills tag input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Technical Stack</label>
              <div className="border border-white/10 rounded-xl bg-dark-950/50 p-2 min-h-[50px] flex flex-wrap gap-1.5 focus-within:border-violet-500 transition">
                {skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-650/20 text-xs font-bold text-violet-300 rounded-lg border border-violet-500/10"
                  >
                    {skill}
                    <button 
                      onClick={() => removeSkill(index)}
                      className="hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Type a skill and press Enter or comma..."
                  className="bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-650 flex-grow focus:outline-none min-w-[150px] py-1 px-2"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Press Enter or comma key after typing to save each skill tag</p>
            </div>

            {/* Target Role input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Desired Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer, Data Scientist"
                className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition"
              />
              
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Suggestions:</span>
                {["Frontend Engineer", "Backend Engineer", "AI Engineer", "Data Scientist"].map((role, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTargetRole(role)}
                    className="px-2 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded-md border border-slate-700 hover:text-slate-200"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => generateRoadmap()}
            disabled={skills.length === 0 || !targetRole.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition duration-200 shadow-neon text-sm disabled:opacity-40"
          >
            <Sparkles className="h-4.5 w-4.5 text-teal-300" />
            Generate 6-Month Roadmap
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
          <LoadingSpinner size="lg" message={`Compiling learning path metrics to specialize in '${targetRole}'. Simulating career tracks and aggregating study assets...`} />
        </div>
      )}

      {/* Timeline output */}
      {roadmap && !loading && (
        <div className="space-y-8">
          {/* Header Info */}
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-violet-500/10 shadow-neon">
            <div>
              <span className="block text-[10px] font-bold text-violet-400 uppercase tracking-widest">Upskilling Strategy</span>
              <h2 className="text-xl font-bold font-sans text-white">Target Role: <span className="gradient-text">{roadmap.target_role}</span></h2>
            </div>
            
            <button
              onClick={() => setRoadmap(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/5 transition"
            >
              Reset Inputs
            </button>
          </div>

          {/* Timeline visualization flow */}
          <div className="relative border-l border-violet-600/35 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8 pb-4">
            
            {roadmap.months.map((m) => (
              <div key={m.month} className="relative group animate-fadeIn">
                
                {/* Timeline node dot indicator */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 h-8 w-8 rounded-full bg-slate-900 border-2 border-violet-500 flex items-center justify-center text-xs font-bold text-violet-300 shadow-neon group-hover:scale-110 transition">
                  {m.month}
                </div>

                {/* Milestone Detail Card */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-violet-500/25 transition duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider">Milestone Phase {m.month}</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{m.title}</h3>
                    </div>
                    
                    <span className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1 bg-violet-600/10 text-violet-300 text-xs font-bold rounded-full border border-violet-500/15">
                      <BookOpen className="h-3.5 w-3.5" />
                      Month {m.month}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Objectives */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-emerald-400" />
                        Learning Goals
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-350">
                        {m.goals.map((g, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-2 shrink-0 animate-pulse" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resources & Milestone project */}
                    <div className="space-y-4">
                      {/* Resources */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-violet-400" />
                          Recommended Free Assets
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {m.resources.map((res, index) => (
                            <span key={index} className="px-2 py-0.5 bg-slate-800 text-[11px] text-slate-300 rounded border border-slate-700 font-medium">
                              {res}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Project Milestone */}
                      <div className="p-3.5 bg-violet-950/10 border border-violet-500/10 rounded-xl">
                        <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <MilestoneIcon className="h-4 w-4" />
                          Demonstrable Milestone Project
                        </h4>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          {m.milestone}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ))}
            
          </div>
        </div>
      )}
    </div>
  );
};
export default CareerRoadmapPage;
