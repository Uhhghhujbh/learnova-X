import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword } from '../../lib/utils/security';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';
import Modal from '../../components/ui/Modal/Modal';
import Toast from '../../components/ui/Toast/Toast';
import { useLocation } from 'react-router-dom';

const Auth: React.FC = () => {
  const { signUp, signIn } = useAuth();
  const location = useLocation();
  const isPage = location.pathname === '/auth';
  
  const [isOpen, setIsOpen] = useState(isPage);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleOpenAuth = () => setIsOpen(true);
    window.addEventListener('openAuthModal' as any, handleOpenAuth);
    return () => window.removeEventListener('openAuthModal' as any, handleOpenAuth);
  }, []);

  useEffect(() => {
    setIsOpen(isPage);
  }, [isPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin && !validatePassword(formData.password)) {
      setToast({ message: 'Password must be 8+ chars with uppercase, number & special char', type: 'error' });
      setLoading(false);
      return;
    }

    const { error } = isLogin 
      ? await signIn(formData.email, formData.password)
      : await signUp(formData.email, formData.password, formData.username, formData.displayName);

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: isLogin ? 'Signed in successfully' : 'Check your email for verification', type: 'success' });
      if (isLogin && !isPage) setIsOpen(false);
    }
    setLoading(false);
  };

  const content = (
    <div className="p-6 w-96">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <Input label="Username" type="text" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} required />
            <Input label="Display Name" type="text" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))} required />
          </>
        )}
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
        <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} required />
        <Button type="submit" loading={loading} className="w-full">{isLogin ? 'Sign In' : 'Sign Up'}</Button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm text-gray-600 dark:text-gray-400 mt-4 hover:text-gray-900 dark:hover:text-white">
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );

  if (isPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          {content}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {content}
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};
export default Auth; 
