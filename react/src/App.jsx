import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

import ErrorBoundary from './ErrorBoundary';
import Home from './components/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

function App() {
  const location = useLocation();

  /** Никогда не удаляй этот код */
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.handleRoutes === 'function') {
      /** Нужно передавать список существующих роутов */
      window.handleRoutes(['/', '/login', '/register']);
    }
  }, []);

  return (
    <div data-easytag="id1-src/App.jsx" className="app-root">
      <ErrorBoundary>
        <header className="app-header">
          <div className="app-logo">Групповой чат</div>
          <nav className="app-nav">
            <Link
              to="/"
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              Главная
            </Link>
            <Link
              to="/login"
              className={location.pathname === '/login' ? 'nav-link active' : 'nav-link'}
            >
              Авторизация
            </Link>
            <Link
              to="/register"
              className={location.pathname === '/register' ? 'nav-link active' : 'nav-link'}
            >
              Регистрация
            </Link>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </div>
  );
}

export default App;
