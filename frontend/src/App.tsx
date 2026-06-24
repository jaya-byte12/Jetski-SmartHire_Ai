import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SingleAnalyzerPage } from './pages/SingleAnalyzerPage';
import { BulkScreeningPage } from './pages/BulkScreeningPage';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage';
import { UserProfile, firebaseAuthService } from './services/firebase';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  
  // Prefill states for page communication
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [roadmapPrefill, setRoadmapPrefill] = useState<{ skills: string[], role: string } | null>(null);

  // Subscribe to Authentication state changes (Google OAuth)
  useEffect(() => {
    const unsubscribe = firebaseAuthService.subscribeAuthState((profile) => {
      setUser(profile);
    });
    return () => unsubscribe();
  }, []);

  // Auth routing guard: Redirect to Landing if logged out, or to Dashboard if logged in
  useEffect(() => {
    if (!user) {
      setCurrentPage('landing');
    } else if (currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [user]);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
        return (
          <DashboardPage 
            setCurrentPage={setCurrentPage} 
            setSelectedHistoryItem={setSelectedHistoryItem}
          />
        );
      case 'single':
        return (
          <SingleAnalyzerPage 
            selectedHistoryItem={selectedHistoryItem}
            setSelectedHistoryItem={setSelectedHistoryItem}
            setCurrentPage={setCurrentPage}
            setRoadmapPrefill={setRoadmapPrefill}
          />
        );
      case 'bulk':
        return <BulkScreeningPage />;
      case 'career':
        return (
          <CareerRoadmapPage 
            roadmapPrefill={roadmapPrefill} 
            setRoadmapPrefill={setRoadmapPrefill}
          />
        );
      default:
        return <LandingPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-background text-slate-200">
        <Navbar 
          user={user} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
        
        {/* Main Content Area */}
        <main className="flex-grow">
          {renderActivePage()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
