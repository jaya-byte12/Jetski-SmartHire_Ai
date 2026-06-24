import React, { useState } from 'react';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  FileSearch, 
  Files, 
  Map, 
  LogOut, 
  LogIn, 
  Menu, 
  X 
} from 'lucide-react';
import { UserProfile, firebaseAuthService } from '../services/firebase';

interface NavbarProps {
  user: UserProfile | null;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentPage,
  setCurrentPage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      await firebaseAuthService.signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.logout();
      setCurrentPage('landing');
    } catch (e) {
      console.error(e);
    }
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'single', name: 'Resume Analyzer', icon: FileSearch },
    { id: 'bulk', name: 'Bulk Screener', icon: Files },
    { id: 'career', name: 'Career Roadmap', icon: Map },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-white/5 shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div 
            onClick={() => setCurrentPage(user ? 'dashboard' : 'landing')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-650 rounded-xl group-hover:shadow-neon transition-shadow">
              <BrainCircuit className="h-5 w-5 text-teal-300" />
            </div>
            <span className="text-lg font-bold font-sans tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
              SmartHire <span className="text-violet-400">AI</span>
            </span>
          </div>

          {/* Desktop Navigation Links (Only shown when user is authenticated) */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition duration-200 ${
                      isActive 
                        ? 'bg-violet-600/15 text-violet-300 border border-violet-500/25 shadow-neon'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* User Account / Login Button */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.displayName}`} 
                  alt="Avatar" 
                  className="h-7 w-7 rounded-full border border-violet-500/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`;
                  }}
                />
                <span className="text-xs font-semibold text-slate-300 max-w-[120px] truncate">
                  {user.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1 hover:text-red-400 text-slate-400 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-650 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition duration-200 shadow-neon disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                {loggingIn ? 'Connecting...' : 'Recruiter Login'}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && user && (
        <div className="md:hidden glass-panel border-x-0 border-b border-white/5 p-4 space-y-2 animate-fadeIn">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
                  isActive 
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            );
          })}
          
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.displayName}`} 
                alt="Avatar" 
                className="h-8 w-8 rounded-full border border-violet-500/30"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">{user.displayName}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="p-2 text-slate-400 hover:text-red-400 transition"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {mobileMenuOpen && !user && (
        <div className="md:hidden glass-panel border-x-0 border-b border-white/5 p-4 animate-fadeIn">
          <button
            onClick={() => {
              handleLogin();
              setMobileMenuOpen(false);
            }}
            disabled={loggingIn}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-650 rounded-xl"
          >
            <LogIn className="h-5 w-5" />
            {loggingIn ? 'Connecting...' : 'Recruiter Login'}
          </button>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
