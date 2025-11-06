import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// Import page components
import HomePage from './pages/HomePage';
import SummonerPage from './pages/SummonerPage';
import AnalysisPage from './pages/AnalysisPage';

// Import global components
import GlobalChatbot from './components/GlobalChatbot';
import SessionManager from './components/SessionManager';

// Import context providers
import { SessionProvider } from './contexts/SessionContext';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="main-nav">
      <Link 
        to="/" 
        className={`nav-link ${isActive('/') ? 'active' : ''}`}
      >
        홈
      </Link>
      <Link 
        to="/summoner" 
        className={`nav-link ${isActive('/summoner') ? 'active' : ''}`}
      >
        소환사 검색
      </Link>
      <Link 
        to="/analysis" 
        className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}
      >
        전적 분석
      </Link>
    </nav>
  );
};

function App() {
  return (
    <SessionProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <div className="header-content">
              <Link to="/" className="logo">
                <h1>LoL Match Analyzer</h1>
              </Link>
              <Navigation />
              <SessionManager className="compact" />
            </div>
          </header>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/summoner" element={<SummonerPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
            </Routes>
          </main>
          
          {/* Global Chatbot - available on all pages */}
          <GlobalChatbot />
        </div>
      </Router>
    </SessionProvider>
  );
}

export default App;