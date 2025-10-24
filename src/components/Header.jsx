import React from 'react';
import { Home, LogOut, Sun, Moon, Menu, X, Search } from 'lucide-react';

export default function Header({ 
  theme, 
  toggleTheme, 
  onHomeClick, 
  onLogout, 
  search, 
  setSearch, 
  menuOpen, 
  setMenuOpen,
  user,
  isAdmin,
  navigate 
}) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Learnova X
          </h1>

          <div className="hidden md:flex flex-1 mx-8 relative max-w-xl">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={onHomeClick}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Single click: Reload | Double click: Go back"
            >
              <Home size={20} />
            </button>

            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user && (
              <button onClick={onLogout} className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <LogOut size={20} />
              </button>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 pb-2 space-y-2">
            {user && (
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Admin Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
