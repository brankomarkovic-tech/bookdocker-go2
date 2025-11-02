import React, { useState, useEffect, useRef } from 'react';
import FeedbackModal from './FeedbackModal';
import AudioPlayerModal from './AudioPlayerModal';
import { useAppContext } from '../hooks/useAppContext';

const Footer: React.FC = () => {
  const { navigateToTerms, navigateToPrivacy } = useAppContext();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isFabExtended, setIsFabExtended] = useState(true);
  const lastScrollY = useRef(0);

  // This effect implements the Gmail-style FAB behavior based on scroll direction.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // A small threshold to prevent jittering on minor scrolls or on certain devices.
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) {
        return;
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Scrolling down
        setIsFabExtended(false);
      } else {
        // Scrolling up
        setIsFabExtended(true);
      }

      // Update last scroll position, but only if it's a positive value
      lastScrollY.current = Math.max(0, currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  return (
    <>
      {/* Floating Action Button for Audio Player */}
      <button
        onClick={() => setIsAudioPlayerOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 flex items-center bg-customBlue-600 text-white font-bold rounded-full shadow-lg hover:bg-customBlue-700 transition-all duration-300 ease-in-out"
        aria-label="Listen to Spotlights"
      >
        <div className="p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>
        <span
          className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            isFabExtended ? 'max-w-48 pr-5 pl-0' : 'max-w-0 pr-0 pl-0'
          }`}
        >
          Listen to Spotlights
        </span>
      </button>

      {/* Footer is now static */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-4 text-center">
            <div className="text-xs text-gray-400 mb-2">
                By using this Web site, you confirm that you have read, understood, and agreed to be bound by the{' '}
                <button onClick={navigateToTerms} className="underline hover:text-white transition-colors">
                    Terms and Conditions
                </button>.
            </div>
          <div className="flex justify-center items-center gap-4 mt-1 flex-wrap">
            <p className="text-sm text-gray-400">A meeting point for book lovers.</p>
            <span className="text-gray-500 hidden sm:inline">|</span>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="text-sm text-customBlue-100 hover:text-white hover:underline transition-colors"
            >
              Provide Feedback
            </button>
            <span className="text-gray-500 hidden sm:inline">|</span>
            <a
              href="https://www.youtube.com/@bookdocker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-customBlue-100 hover:text-white hover:underline transition-colors"
            >
              Tutorials
            </a>
          </div>
          <div className="flex justify-center items-center gap-4 mt-2 flex-wrap border-t border-gray-700 pt-2">
            <button onClick={navigateToTerms} className="text-sm text-customBlue-100 hover:text-white hover:underline transition-colors">
                Terms and Conditions
            </button>
            <span className="text-gray-500">|</span>
             <button onClick={navigateToPrivacy} className="text-sm text-customBlue-100 hover:text-white hover:underline transition-colors">
                Privacy Policy
            </button>
          </div>
           <p className="text-xs text-gray-500 mt-2">&copy; {new Date().getFullYear()} BookDocker GO2. All rights reserved.</p>
        </div>
      </footer>

      <AudioPlayerModal 
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </>
  );
};

export default Footer;