import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { sendLoginOtp, verifyLoginOtp } = useAppContext();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }
    setError('');
    setIsLoading(true);

    const { error: otpError } = await sendLoginOtp(email);
    setIsLoading(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      setStep('otp');
    }
  };

  const handleVerifyCode = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setError('');
    setIsLoading(true);

    const { error: verifyError } = await verifyLoginOtp(email, otp);
    setIsLoading(false);

    if (verifyError) {
      setError(verifyError.message);
    } else {
      onClose(); // Success! onAuthStateChange will handle setting the user.
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (step === 'email') {
        handleSendCode();
      } else {
        handleVerifyCode();
      }
  }

  const resetForm = () => {
    setEmail('');
    setOtp('');
    setError('');
    setStep('email');
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
      onClick={resetForm} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="login-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 id="login-modal-title" className="text-xl font-bold text-gray-800">Login</h2>
          <button onClick={resetForm} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" aria-label="Close login form">
            &times;
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 'email' ? (
            <>
              <p className="text-sm text-gray-600">
                Enter your email address to receive a one-time login code.
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
                  placeholder="you@example.com"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                A 6-digit code has been sent to <strong>{email}</strong>. Please enter it below.
              </p>
              <div>
                <label htmlFor="login-otp" className="block text-sm font-medium text-gray-700">Login Code</label>
                <input 
                  type="text" 
                  id="login-otp" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  required 
                  maxLength={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-center tracking-[0.5em]"
                  placeholder="_ _ _ _ _ _"
                />
              </div>
               <button type="button" onClick={() => setStep('email')} className="text-sm text-customBlue-600 hover:underline">Use a different email</button>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="py-2 px-6 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (step === 'email' ? 'Send Code' : 'Verify & Login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;