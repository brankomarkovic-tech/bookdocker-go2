import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
// FIX: Removed unused credentials import. GUEST_CREDENTIALS and PREMIUM_CREDENTIALS were not exported from constants, causing an error. ADMIN_CREDENTIALS was also unused.

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (loginEmail?: string) => {
    const emailToLogin = (loginEmail || email).trim();
    if (!emailToLogin) {
      setError('Please enter an email address.');
      return;
    }
    setError('');
    setIsLoading(true);

    const user = await login(emailToLogin);

    setIsLoading(false);
    if (user) {
      onClose();
    } else {
      setError('Login failed. Please check the email and try again.');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin();
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="login-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 id="login-modal-title" className="text-xl font-bold text-gray-800">Login</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" aria-label="Close login form">
            &times;
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Enter an expert's email or use one of the quick logins for demonstration.
          </p>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
              placeholder="expert@example.com"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="py-2 px-6 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
