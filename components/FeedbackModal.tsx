import React, { useState } from 'react';
import { invokeSendEmailFunction } from '../services/apiService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Feedback message cannot be empty.');
      return;
    }
    
    setIsSending(true);
    try {
        await invokeSendEmailFunction({
            type: 'feedback',
            senderName: name,
            senderEmail: email,
            message,
        });

        setIsSent(true);
        setName('');
        setEmail('');
        setMessage('');

        setTimeout(() => {
            onClose();
            setTimeout(() => setIsSent(false), 300);
        }, 3000);

    } catch (error) {
        alert(error instanceof Error ? error.message : "An unexpected error occurred while sending feedback.");
    } finally {
        setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSent && !isSending) {
      onClose();
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
      onClick={handleClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="feedback-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 id="feedback-modal-title" className="text-xl font-bold text-gray-800">
            Provide Feedback
          </h2>
          {!isSent && !isSending && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" aria-label="Close feedback form">
              &times;
            </button>
          )}
        </header>
        
        <div className="p-6">
          {isSent ? (
            <div className="text-center py-8">
              <div className="bg-green-100 text-green-800 p-4 rounded-lg font-semibold">
                  Thank you! Your feedback has been submitted successfully.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
               <p className="text-sm text-gray-600">
                Have a suggestion or found a bug? Let us know! We appreciate your input.
              </p>
              <div>
                <label htmlFor="feedback-name" className="block text-sm font-medium text-gray-700">Your Name (Optional)</label>
                <input 
                  type="text" 
                  id="feedback-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                  placeholder="Jane Doe"
                  disabled={isSending}
                />
              </div>
              
              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700">Your Email (Optional)</label>
                <input 
                  type="email" 
                  id="feedback-email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                  placeholder="you@example.com"
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea 
                  id="feedback-message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5} 
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                  placeholder="I think it would be great if..."
                  disabled={isSending}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSending} className="py-2 px-4 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-wait">
                    {isSending ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
