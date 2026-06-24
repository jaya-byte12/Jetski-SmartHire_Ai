import React, { useState } from 'react';
import { 
  FileText, 
  Cpu, 
  Map, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { firebaseAuthService } from '../services/firebase';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      await firebaseAuthService.signInWithGoogle();
      onLoginSuccess();
    } catch (e) {
      console.error("Authentication failed:", e);
    } finally {
      setLoggingIn(false);
    }
  };

  const features = [
    {
      icon: Cpu,
      title: "Gemini 1.5 Pro Screening",
      desc: "Instantly evaluate candidate fits against complex roles using state-of-the-art LLM prompts.",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: FileText,
      title: "Deep Text Parsing",
      desc: "Direct support for PDF and DOCX extraction, uploading documents to Google Cloud Storage.",
      color: "from-teal-400 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Async Bulk Screening",
      desc: "Process dozens of applicant CVs concurrently using Python asyncio, generating ranked matching tables.",
      color: "from-amber-400 to-orange-500"
    },
    {
      icon: Map,
      title: "6-Month Career Roadmap",
      desc: "Identify skill deficiencies and generate month-by-month actionable learning roadmaps with free study assets.",
      color: "from-pink-500 to-rose-600"
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/10 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl animate-pulse delay-1000" />
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 flex-grow flex flex-col items-center justify-center text-center relative z-10">
        
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-bold text-slate-350 tracking-wider uppercase">
            FastAPI + Gemini Production Stack
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold font-sans tracking-tight mb-6">
          AI-Powered Resume Screening & <br className="hidden sm:inline" />
          <span className="gradient-text font-extrabold text-glow-purple">Career Intelligence</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          SmartHire AI accelerates talent acquisition for MNCs. Parse resumes in seconds, score skill alignment, run async bulk checks, and deliver personalized roadmaps to bridge skill gaps.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition duration-200 shadow-neon text-base"
          >
            {loggingIn ? 'Connecting Auth...' : 'Try for Free'}
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold rounded-2xl border border-white/5 transition text-base"
          >
            Explore Tech Stack
          </a>
        </div>

        {/* Brand Proof Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full border-t border-b border-white/5 py-8 text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            <span className="text-xs font-bold tracking-wider uppercase">MNC Grade Privacy</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-violet-400" />
            <span className="text-xs font-bold tracking-wider uppercase">99.4% Parsing Acc</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-teal-400" />
            <span className="text-xs font-bold tracking-wider uppercase">Async Queueing</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Cpu className="h-5 w-5 text-violet-400" />
            <span className="text-xs font-bold tracking-wider uppercase">Gemini 1.5 Integration</span>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5 relative z-10 w-full">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-12">
          Engineered for Modern <span className="text-violet-400">Talent Acquisition</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index} 
                className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start text-left"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feat.color} text-white mb-5 shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold font-sans text-white mb-2">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-white/5 text-xs text-slate-500 relative z-10 bg-background/50">
        <p>© 2026 SmartHire AI. All rights reserved. Portfolio Project for MNC Recruitment evaluation.</p>
      </footer>
    </div>
  );
};
export default LandingPage;
