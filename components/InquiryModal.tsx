import React, { useState, useEffect } from 'react';
import { Expert, Book } from '../types';
import { EmailIcon } from './icons';
import { invokeSendEmailFunction } from '../services/apiService';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  book: Book;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, expert, book }) => {
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (book && isOpen) {
      const priceString = book.price ? ` at the listed price of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: book.currency || 'USD' }).format(book.price)}` : '';
      const inquiryBody = `Hello ${expert.name},\n\nI am interested in purchasing your book${priceString}:\n\nTitle: ${book.title}\nAuthor: ${book.author}\nYear: ${book.year}\n\nPlease let me know how we can arrange the purchase and shipping.\n\nThank you,\n`;
      setMessage(inquiryBody);
      // Reset form state when modal is opened for a new book
      setSenderEmail('');
      setIsSent(false);
      setIsSending(false);
    }
  }, [book, expert.name, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail) {
        alert('Please enter your email address.');
        return;
    }
    
    setIsSending(true);
    try {
        await invokeSendEmailFunction({
            type: 'inquiry',
            senderEmail,
            message,
            expertName: expert.name,
            expertEmail: expert.email,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookYear: book.year,
        });

        setIsSent(true);
        setTimeout(() => {
          onClose();
        }, 3000);

    } catch (error) {
        alert(error instanceof Error ? error.message : "An unexpected error occurred while sending the inquiry.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="inquiry-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 id="inquiry-modal-title" className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <EmailIcon className="w-6 h-6 text-customBlue-600" />
            Inquire about a Book
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" aria-label="Close inquiry form">
            &times;
          </button>
        </header>
        
        <div className="p-6">
          {isSent ? (
            <div className="text-center py-8">
              <div className="bg-green-100 text-green-800 p-4 rounded-lg font-semibold">
                  Inquiry sent successfully! The expert will contact you at your email address.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-gray-50 border rounded-md">
                <p className="font-semibold text-gray-800">{book.title}</p>
                <p className="text-sm text-gray-600">by {book.author}</p>
                {book.price && (
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: book.currency || 'USD' }).format(book.price)}
                    </p>
                )}
              </div>
              
              <div>
                <label htmlFor="inquiry-sender-email" className="block text-sm font-medium text-gray-700">Your Email Address</label>
                <input 
                  type="email" 
                  id="inquiry-sender-email" 
                  value={senderEmail} 
                  onChange={(e) => setSenderEmail(e.target.value)} 
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                  placeholder="you@example.com"
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="inquiry-message" className="block text-sm font-medium text-gray-700">Message to {expert.name}</label>
                <textarea 
                  id="inquiry-message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8} 
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                  disabled={isSending}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSending} className="py-2 px-4 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-wait">
                    {isSending ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;
