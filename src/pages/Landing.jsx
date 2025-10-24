import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { Sun, Moon, ArrowRight, Users, BookOpen, Zap } from 'lucide-react';

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { supabase } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (signInError) throw signInError;
        navigate('/news');
      } else {
        // Sign Up
        if (!formData.username || formData.username.trim().length === 0) {
          throw new Error('Username is required');
        }

        // First, sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });
        
        if (authError) throw authError;
        
        // Then insert user profile
        if (authData.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              auth_id: authData.user.id,
              username: formData.username.toLowerCase(),
              email: formData.email,
              display_name: formData.username
            });
          
          if (userError) {
            console.error('User insert error:', userError);
            throw new Error(userError.message || 'Failed to create user profile');
          }
        }
        
        setError('');
        alert('Sign up successful! Please log in now.');
        setIsLogin(true);
        setFormData({ email: '', password: '', username: '' });
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleReadNews = () => {
    navigate('/news');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
            LX
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Learnova X
          </h1>
        </div>

        <button onClick={toggleTheme} className="p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition">
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Be <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">X</span> and Informed
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join a vibrant community where education meets innovation. Share knowledge, discover opportunities, and stay ahead with real-time updates.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <BookOpen size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Quality Education</h3>
                  <p className="text-gray-400">Access curated content from industry experts</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Users size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Community Driven</h3>
                  <p className="text-gray-400">Connect with professionals and peers</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-500 bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap size={24} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-Time Updates</h3>
                  <p className="text-gray-400">Never miss important industry news</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleReadNews}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-lg transition transform hover:scale-105 shadow-lg"
            >
              Explore News <ArrowRight size={20} />
            </button>
          </div>

          {/* Right Side - Auth Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
            
            <div className="relative bg-slate-800 bg-opacity-80 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-2xl">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">
                  {isLogin ? 'Welcome Back' : 'Join Us'}
                </h3>
                <p className="text-gray-400">
                  {isLogin ? 'Continue your learning journey' : 'Start sharing and learning today'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Username</label>
                    <input
                      type="text"
                      placeholder="Choose your username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition outline-none text-white placeholder-gray-500"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition outline-none text-white placeholder-gray-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition outline-none text-white placeholder-gray-500"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg transition mt-6"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="w-full text-center text-gray-400 hover:text-blue-400 transition"
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-blue-400 font-semibold">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700 mt-20 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2024 Learnova X. All rights reserved. | Empowering knowledge sharing worldwide</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
