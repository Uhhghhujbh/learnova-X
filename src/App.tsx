import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header/Header';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
        </Routes>
      </main>
      <Auth /> {/* Keep modal version for header button */}
    </div>
  );
};

export default App;