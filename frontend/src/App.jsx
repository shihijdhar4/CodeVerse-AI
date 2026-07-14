import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Challenges from './pages/Challenges';
import HistoryPage from './pages/History';
import AIChat from './pages/AIChat';
import Profile from './pages/Profile';
import AdminPanel from './pages/Admin';
import SharedView from './pages/SharedView';

const MainAppContent = () => {
  const { user, token, loading } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [sharedTokenCheck, setSharedTokenCheck] = useState('');
  const [loadedProgram, setLoadedProgram] = useState(null);

  // Check URL Hash for shared token route configuration
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/shared\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setSharedTokenCheck(match[1]);
      } else {
        setSharedTokenCheck('');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Trigger on boot

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-white text-md font-bold">Resonating CodeVerse AI Sandbox...</h2>
          <p className="text-slate-500 text-xs mt-1">Establishing secure connection protocols</p>
        </div>
      </div>
    );
  }

  // RENDER DYNAMIC SHARED VIEW (Public Landing read only)
  if (sharedTokenCheck) {
    return <SharedView shareToken={sharedTokenCheck} />;
  }

  // RENDER LOGIN SCREEN (Unauthenticated state)
  if (!token) {
    return <Login />;
  }

  // RENDER COMPLETED ENVIRONMENT PAGE (Authenticated workspace)
  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-[#0b0f19]">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'editor' && (
          <Editor 
            loadedProgram={loadedProgram} 
            clearLoadedProgram={() => setLoadedProgram(null)} 
          />
        )}
        {activeView === 'challenges' && <Challenges />}
        {activeView === 'history' && (
          <HistoryPage 
            setActiveView={setActiveView} 
            setOpenProgramTrigger={setLoadedProgram} 
          />
        )}
        {activeView === 'ai-chat' && <AIChat />}
        {activeView === 'profile' && <Profile />}
        {activeView === 'admin' && user?.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
