import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword } from '../../lib/utils/security';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';
import Modal from '../../components/ui/Modal/Modal';
import Toast from '../../components/ui/Toast/Toast';
import { useLocation } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';

const Auth: React.FC = () => {
  const { signUp, signIn } = useAuth();
  const location = useLocation();
  const isPage = location.pathname === '/auth';
  
  const [isOpen, setIsOpen] = useState(isPage);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    username: '', 
    displayName: '' 
  });
  const [loading, setLoading] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleOpenAuth = () => setIsOpen(true);
    window.addEventListener('openAuthModal' as any, handleOpenAuth);
    return () => window.removeEventListener('openAuthModal' as any, handleOpenAuth);
  }, []);

  useEffect(() => {
    setIsOpen(isPage);
  }, [isPage]);

  // Verify email domain before signup
  const verifyEmailDomain = async (email: string): Promise<boolean> => {
    try {
      setEmailVerifying(true);
      
      const { data, error } = await supabase.functions.invoke('verify-email-domain', {
        body: { email, action: 'signup' }
      });

      if (error || !data?.allowed) {
        setToast({ 
          message: data?.error || 'Email verification failed', 
          type: 'error' 
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      setToast({ 
        message: 'Email verification service unavailable. Please try again.', 
        type: 'error' 
      });
      return false;
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!isLogin) {
      // Check Gmail only
      if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
        setToast({ 
          message: 'Only Gmail accounts are allowed', 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      // Verify password strength
      if (!validatePassword(formData.password)) {
        setToast({ 
          message: 'Password must be 8+ chars with uppercase, number & special char', 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      // Verify email domain
      const emailValid = await verifyEmailDomain(formData.email);
      if (!emailValid) {
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setShowVerificationMessage(true);
            setToast({ 
              message: 'Please verify your email before signing in. Check your inbox.', 
              type: 'error' 
            });
          } else if (error.message.includes('Invalid login credentials')) {
            setToast({ 
              message: 'Invalid email or password', 
              type: 'error' 
            });
          } else {
            setToast({ message: error.message, type: 'error' });
          }
        } else {
          setToast({ message: 'Signed in successfully', type: 'success' });
          if (!isPage) setIsOpen(false);
        }
      } else {
        const { error } = await signUp(
          formData.email, 
          formData.password, 
          formData.username, 
          formData.displayName
        );
        
        if (error) {
          if (error.message.includes('already registered')) {
            setToast({ 
              message: 'This email is already registered. Please sign in.', 
              type: 'error' 
            });
          } else if (error.message.includes('rate_limit')) {
            setToast({ 
              message: 'Too many attempts. Please try again later.', 
              type: 'error' 
            });
          } else {
            setToast({ message: error.message, type: 'error' });
          }
        } else {
          setShowVerificationMessage(true);
          setToast({ 
            message: 'Account created! Please check your email to verify your account.', 
            type: 'success' 
          });
          setFormData({ email: '', password: '', username: '', displayName: '' });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setToast({ 
        message: 'An unexpected error occurred. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      });

      if (error) {
        setToast({ message: error.message, type: 'error' });
      } else {
        setToast({ 
          message: 'Verification email sent! Please check your inbox.', 
          type: 'success' 
        });
      }
    } catch (err) {
      setToast({ message: 'Failed to resend email', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isLogin ? 'Sign In' : 'Sign Up'}
      </h2>

      {showVerificationMessage && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Verify Your Email
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                We've sent a verification link to <strong>{formData.email}</strong>
              </p>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={resendVerificationEmail}
                disabled={loading}
              >
                Resend Verification Email
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <Input 
              label="Username" 
              type="text" 
              value={formData.username} 
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') 
              }))}
              placeholder="johndoe"
              maxLength={30}
              required 
            />
            <Input 
              label="Display Name" 
              type="text" 
              value={formData.displayName} 
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                displayName: e.target.value 
              }))}
              placeholder="John Doe"
              maxLength={100}
              required 
            />
          </>
        )}
        
        <div>
          <Input 
            label="Email (Gmail only)" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              email: e.target.value.toLowerCase() 
            }))}
            placeholder="your.email@gmail.com"
            required 
          />
          {!isLogin && !formData.email.endsWith('@gmail.com') && formData.email && (
            <p className="text-xs text-red-500 mt-1">
              Only Gmail accounts are accepted
            </p>
          )}
        </div>

        <div>
          <Input 
            label="Password" 
            type="password" 
            value={formData.password} 
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              password: e.target.value 
            }))}
            placeholder="••••••••"
            minLength={8}
            required 
          />
          {!isLogin && formData.password && (
            <div className="mt-2 space-y-1">
              <PasswordRequirement 
                met={formData.password.length >= 8} 
                text="At least 8 characters" 
              />
              <PasswordRequirement 
                met={/[A-Z]/.test(formData.password)} 
                text="One uppercase letter" 
              />
              <PasswordRequirement 
                met={/[0-9]/.test(formData.password)} 
                text="One number" 
              />
              <PasswordRequirement 
                met={/[@$!%*?&]/.test(formData.password)} 
                text="One special character (@$!%*?&)" 
              />
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          loading={loading || emailVerifying} 
          className="w-full"
          disabled={!isLogin && !formData.email.endsWith('@gmail.com')}
        >
          {emailVerifying ? 'Verifying Email...' : isLogin ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <button 
        onClick={() => {
          setIsLogin(!isLogin);
          setShowVerificationMessage(false);
        }}
        className="w-full text-center text-sm text-gray-600 dark:text-gray-400 mt-4 hover:text-gray-900 dark:hover:text-white"
      >
        {isLogin 
          ? "Don't have an account? Sign up" 
          : "Already have an account? Sign in"}
      </button>
    </div>
  );

  if (isPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
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

// Helper component for password requirements
const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <div className="flex items-center space-x-2 text-xs">
    <CheckCircle className={`w-3.5 h-3.5 ${met ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
    <span className={met ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
      {text}
    </span>
  </div>
);

export default Auth;
