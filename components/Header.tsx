

import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import ProfileForm from './ProfileForm';
import { UserRole, Expert } from '../types';
import { Logo } from './Logo';
import WishlistModal from './WishlistModal';
import { HeartIcon, HoneycombIcon } from './icons';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { wishlist, currentUser, logout, navigateToList, navigateToAdmin, navigateToTitleHive } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const handleLogoClick = () => {
      navigateToList();
  }

  const getWelcomeName = (user: Expert | null): string => {
    if (!user) return '';

    if (user.role === UserRole.BUYER) {
      return 'Buyer';
    }

    const nameParts = user.name.split(' ');
    if (nameParts.length > 1 && nameParts[0].endsWith('.')) {
      return nameParts[1];
    }
    
    return nameParts[0];
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-3 text-current no-underline"
            aria-label="Go to homepage"
          >
            <Logo className="w-10 h-10" />
            <span className="text-base sm:text-lg font-bold text-gray-800">
              BookDocker <span className="text-customBlue-600">GO2</span>
            </span>
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
                onClick={navigateToTitleHive}
                className="relative text-gray-600 hover:text-customBlue-600 transition-colors"
                title="Explore what experts are searching for"
                aria-label="Explore the Title Hive"
            >
                <HoneycombIcon className="w-7 h-7" />
            </button>
             <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative text-gray-600 hover:text-customBlue-600 transition-colors"
              aria-label={`View wishlist, ${wishlist.length} items`}
            >
              <HeartIcon className="w-7 h-7" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            
            {currentUser ? (
              <>
                  <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                      Welcome, {getWelcomeName(currentUser)}!
                  </span>
                  {currentUser.role === UserRole.ADMIN && (
                    <button
                        onClick={navigateToAdmin}
                        className="font-semibold text-customBlue-600 hover:text-customBlue-700 transition-colors"
                    >
                        Admin Panel
                    </button>
                  )}
                  <button
                      onClick={logout}
                      className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
                  >
                      Logout
                  </button>
              </>
            ) : (
              <>
                  <button
                      onClick={() => setIsLoginOpen(true)}
                      className="font-semibold text-gray-600 hover:text-customBlue-600 transition-colors"
                      aria-label="Login"
                  >
                      Login
                  </button>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-customBlue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-customBlue-700 transition duration-300"
                  >
                    Be GO2
                  </button>
              </>
            )}
          </div>
        </div>
      </header>
      {isFormOpen && <ProfileForm onClose={() => setIsFormOpen(false)} />}
      <WishlistModal isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
};

export default Header;