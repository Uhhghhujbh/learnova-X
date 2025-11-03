import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import { Search, Bell, Pin, Sun, Moon, LogOut, User } from 'lucide-react';
interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => { 
  const { user, signOut, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) 
        setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('searchUpdate', { detail: query }));
    }, 500);
    setSearchQuery(query);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light'); return (<header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-16"><div className="flex items-center space-x-4"><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 rounded-lg flex items-center justify-center text-white dark:text-gray-900 font-bold text-sm">LXVI</div><span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Learnova X</span></div></div><div className="flex-1 max-w-2xl mx-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Search posts..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent" /></div></div><div className="flex items-center space-x-3"><Button variant="ghost" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('openPinModal'))}><Pin className="w-5 h-5" /></Button><div className="relative" ref={notificationsRef}><Button variant="ghost" size="sm" onClick={() => setShowNotifications(!showNotifications)}><Bell className="w-5 h-5" /><span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span></Button>{showNotifications && (<div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"><div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"><h3 className="font-semibold">Notifications</h3>{unreadCount > 0 && (<button onClick={markAllAsRead} className="text-sm text-blue-500 hover:text-blue-600">Mark all as read</button>)}</div><div className="divide-y divide-gray-200 dark:divide-gray-700">{notifications.length === 0 ? (<p className="p-4 text-center text-gray-500">No notifications</p>) : notifications.map(notification => (<div key={notification.id} className={`p-4 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}><p className="text-sm">{notification.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleDateString()}</p></div>))}</div></div>)}</div><Button variant="ghost" size="sm" onClick={toggleTheme}>{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</Button>{user ? (<div className="relative" ref={userMenuRef}><Button variant="ghost" size="sm" onClick={() => setShowUserMenu(!showUserMenu)}><User className="w-5 h-5" /></Button>{showUserMenu && (<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"><button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Profile</button><button onClick={signOut} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"><LogOut className="w-4 h-4 mr-2" />Sign Out</button></div>)}</div>) : (<Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}>Sign In</Button>)}{isAdmin && (<div className="flex items-center ml-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium"><div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>Admin</div>)}</div></div></div></header>); };
export default Header; 