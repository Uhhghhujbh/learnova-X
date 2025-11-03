import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword } from '../../lib/utils/security';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';
import Modal from '../../components/ui/Modal/Modal';
import Toast from '../../components/ui/Toast/Toast';

const Auth: React.FC = () => {
  const { signUp, signIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleOpenAuth = () => setIsOpen(true);
    window.addEventListener('openAuthModal', handleOpenAuth);
    return () => window.removeEventListener('openAuthModal', handleOpenAuth);
  }, []);

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
      if (isLogin) setIsOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-6 w-96">
          <h2 className="text-2xl font-bold mb-6">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
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
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm text-gray-600 mt-4">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default Auth;