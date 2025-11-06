import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header/Header';
import SplashScreen from './components/features/Splash/SplashScreen';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PostDetailPage from './pages/PostView';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
      setAppReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setAppReady(true);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;

  if (!appReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (appReady && !loading && isAdmin && location.pathname === '/') {
      navigate('/admin');
    }
  }, [appReady, loading, isAdmin, location, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={isAdmin ? <Navigate to="/admin" /> : <Home />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
