import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// Import page components
import HomePage from './pages/HomePage';
import ChampionsPage from './pages/ChampionsPage';
import SummonerPage from './pages/SummonerPage';
import AnalysisPage from './pages/AnalysisPage';

// Import global components
import SessionManager from './components/SessionManager';

// Import context providers
import { SessionProvider } from './contexts/SessionContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Import LanguageToggle component
import LanguageToggle from './components/LanguageToggle';

// Import translation hook
import { useTranslation } from './hooks/useTranslation';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="main-nav">
      <Link 
        to="/" 
        className={`nav-link ${isActive('/') ? 'active' : ''}`}
      >
        {t('nav.home')}
      </Link>
      <Link 
        to="/champions" 
        className={`nav-link ${isActive('/champions') ? 'active' : ''}`}
      >
        {t('nav.champions')}
      </Link>
      <Link 
        to="/summoner" 
        className={`nav-link ${isActive('/summoner') ? 'active' : ''}`}
      >
        {t('nav.summoner')}
      </Link>
      <Link 
        to="/analysis" 
        className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}
      >
        {t('nav.analysis')}
      </Link>
    </nav>
  );
};

function App() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <Router>
          <div className="App">
            <header className="App-header">
              <div className="header-content">
                <Link to="/" className="logo">
                  <h1>LoL Match Analyzer</h1>
                </Link>
                <Navigation />
                <div className="header-actions">
                  <LanguageToggle />
                  <SessionManager className="compact" />
                </div>
              </div>
            </header>
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/champions" element={<ChampionsPage />} />
                <Route path="/summoner" element={<SummonerPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SessionProvider>
    </LanguageProvider>
  );
}

export default App;