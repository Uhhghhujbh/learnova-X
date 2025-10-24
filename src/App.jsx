import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './api/supabase';
import Landing from './pages/Landing';
import NewsFeed from './pages/NewsFeed';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export const AuthContext = React.createContext();
export const ThemeContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) await checkUser(session.user);
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await checkUser(session.user);
      setLoading(false);
    } catch (err) {
      console.error('Auth error:', err);
      setLoading(false);
    }
  };

  const checkUser = async (authUser) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();
      if (data) {
        setUser(data);
        setIsAdmin(data.role === 'admin');
      }
    } catch (err) {
      console.error('User check error:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, supabase, checkUser }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/news" element={user ? <NewsFeed /> : <Navigate to="/" />} />
            <Route path="/news/:postId" element={user ? <NewsFeed /> : <Navigate to="/" />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
