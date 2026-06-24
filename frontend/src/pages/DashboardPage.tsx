import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Percent, 
  Tags, 
  ArrowUpRight, 
  FileSearch, 
  Files, 
  Map, 
  ChevronLeft, 
  ChevronRight, 
  Plus 
} from 'lucide-react';
import { apiService, HistoryItem } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface DashboardPageProps {
  setCurrentPage: (page: string) => void;
  setSelectedHistoryItem?: (item: HistoryItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  setCurrentPage,
  setSelectedHistoryItem
}) => {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 5;

  const fetchDashboardData = async (page: number) => {
    setLoading(true);
    try {
      const data = await apiService.getHistory(page, ITEMS_PER_PAGE);
      setHistoryData(data.items);
      setTotalItems(data.total);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch past screenings from Firestore. Backend may be offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(currentPageNum);
  }, [currentPageNum]);

  // Aggregate stats from history (or fall back to defaults if empty)
  const totalScreened = totalItems;
  
  // Calculate average score dynamically from fetched listings (or fallback)
  const avgScore = historyData.length > 0 
    ? Math.round(historyData.reduce((acc, curr) => acc + curr.match_score, 0) / historyData.length)
    : 72;

  // Aggregate top skills dynamically (or fallback)
  const getTopSkills = () => {
    if (historyData.length === 0) {
      return ["React", "Python", "TypeScript", "FastAPI", "Docker"];
    }
    const skillCounts: Record<string, number> = {};
    historyData.forEach(item => {
      [...item.matched_skills, ...item.missing_skills].forEach(skill => {
        if (skill) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
      
    return sorted.length > 0 ? sorted.slice(0, 5) : ["TypeScript", "Python", "React", "Docker"];
  };

  const topSkills = getTopSkills();

  const handleRowClick = (item: HistoryItem) => {
    if (setSelectedHistoryItem) {
      setSelectedHistoryItem(item);
      setCurrentPage('single'); // Route to single analyzer where it displays details
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-sans">Recruiter Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400">Evaluate screening pipelines and candidate quality index.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setCurrentPage('single')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-650 rounded-xl hover:from-violet-500 hover:to-indigo-500 shadow-neon transition"
          >
            <Plus className="h-4 w-4" />
            Analyze Resume
          </button>
          <button
            onClick={() => setCurrentPage('bulk')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-teal-300 bg-teal-950/30 hover:bg-teal-900/30 border border-teal-500/25 rounded-xl transition"
          >
            <Files className="h-4 w-4" />
            Bulk Screen
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 p-4 rounded-2xl mb-8 text-xs sm:text-sm leading-relaxed">
          {error} Local mock states are active. Try running `uvicorn main:app` inside the backend folder to launch the local API server.
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Screened */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="p-4 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/10">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Screened</span>
            <span className="text-3xl font-bold font-sans text-white">{totalScreened}</span>
          </div>
        </div>

        {/* Avg Match Score */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="p-4 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/10">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Match Score</span>
            <span className="text-3xl font-bold font-sans text-white">{avgScore}%</span>
          </div>
        </div>

        {/* Top Demanded Skills */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="p-4 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/10">
            <Tags className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Top Skills Demanded</span>
            <div className="flex flex-wrap gap-1">
              {topSkills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold text-slate-350 rounded border border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel - Recent History */}
      <div className="glass-panel rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent Screening Reports</h2>
          <span className="text-xs text-slate-400 font-medium">Page {currentPageNum} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="py-20">
            <LoadingSpinner message="Querying screening records..." />
          </div>
        ) : historyData.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 mb-6">No resumes screened yet. Start by screening a single resume!</p>
            <button
              onClick={() => setCurrentPage('single')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-neon transition"
            >
              <Plus className="h-4 w-4" />
              Upload first resume
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/2 border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-5">Candidate</th>
                  <th className="p-5">File</th>
                  <th className="p-5">Match Score</th>
                  <th className="p-5">Recommendation</th>
                  <th className="p-5">Screened Date</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {historyData.map((item) => (
                  <tr 
                    key={item.id}
                    className="hover:bg-white/2 transition cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    <td className="p-5 font-semibold text-white">
                      {item.candidate_name}
                    </td>
                    <td className="p-5 text-xs text-slate-400 max-w-[150px] truncate">
                      {item.filename}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.match_score >= 80 ? 'bg-emerald-500' : item.match_score >= 60 ? 'bg-teal-400' : item.match_score >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.match_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{item.match_score}%</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        item.recommendation.toLowerCase().includes('strong') 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
                          : item.recommendation.toLowerCase().includes('hire')
                          ? 'bg-teal-950/40 text-teal-300 border-teal-500/20'
                          : item.recommendation.toLowerCase().includes('maybe')
                          ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                          : 'bg-rose-950/40 text-rose-450 border-rose-500/20'
                      }`}>
                        {item.recommendation}
                      </span>
                    </td>
                    <td className="p-5 text-xs text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(item)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-300 transition"
                      >
                        Details
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white/2 border border-white/5 px-4 py-3 rounded-2xl">
          <button
            onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
            disabled={currentPageNum === 1 || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/5 rounded-lg disabled:opacity-40 hover:bg-white/10 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          
          <span className="text-xs text-slate-400 font-semibold">
            Page {currentPageNum} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
            disabled={currentPageNum === totalPages || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/5 rounded-lg disabled:opacity-40 hover:bg-white/10 transition"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
export default DashboardPage;
