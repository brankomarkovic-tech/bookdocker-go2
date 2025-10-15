import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Expert, Book } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null) return null;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(price);
    } catch (e) {
      return `${currency ? currency : '$'}${price.toFixed(2)}`;
    }
};

const WishlistModal: React.FC<WishlistModalProps> = ({ isOpen, onClose }) => {
  const { wishlist, removeFromWishlist, experts, navigateToProfile } = useAppContext();

  if (!isOpen) return null;

  const getBookAndExpert = (bookId: string, expertId: string): { book: Book | null; expert: Expert | null } => {
    const expert = experts.find(e => e.id === expertId);
    if (!expert) return { book: null, expert: null };
    const book = (expert.books || []).find(b => b.id === bookId);
    return { book: book || null, expert };
  };
  
  const handleExpertClick = (expertId: string) => {
    navigateToProfile(expertId);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="wishlist-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 id="wishlist-title" className="text-2xl font-bold text-gray-800">My Wishlist</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" aria-label="Close wishlist">
            &times;
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          {wishlist.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Your wishlist is empty.</p>
              <p className="text-gray-400 mt-2">Add books you're interested in by clicking the heart icon.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {wishlist.map(item => {
                const { book, expert } = getBookAndExpert(item.bookId, item.expertId);
                if (!book || !expert) return null;

                return (
                  <li key={book.id} className="flex items-start p-4 bg-gray-50 rounded-lg space-x-4 border border-gray-200">
                    <img
                      src={book.imageUrl || 'https://picsum.photos/seed/default-book/200/300'}
                      alt={`Cover of ${book.title}`}
                      className="w-20 h-28 object-cover rounded-md shadow-sm flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900 text-lg">{book.title}</h3>
                      <p className="text-sm text-gray-600">{book.author} ({book.year})</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Sold by: <button onClick={() => handleExpertClick(expert.id)} className="font-semibold text-customBlue-600 hover:underline">{expert.name}</button>
                      </p>
                      {book.price && (
                        <p className="text-lg font-bold text-customBlue-700 mt-2">
                          {formatPrice(book.price, book.currency)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={() => removeFromWishlist(book.id)} 
                        className="bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1 px-3 rounded-full text-sm transition"
                        aria-label={`Remove ${book.title} from wishlist`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;