import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Book, Expert, BookStatus, SubscriptionTier } from '../types';
import { BookIcon } from './icons';
import { resizeImage } from '../services/geminiService';
import { FREE_BOOK_LIMIT, PREMIUM_BOOK_LIMIT } from '../constants';

interface EditBooksFormProps {
  expert: Expert;
  onClose: () => void;
}

const EditBooksForm: React.FC<EditBooksFormProps> = ({ expert, onClose }) => {
  const { updateExpertBooks } = useAppContext();
  const [books, setBooks] = useState<(Partial<Book> & { isbnError?: string })[]>((expert.books || []).length > 0 ? [...(expert.books || [])] : [{ title: '', author: '', year: undefined, imageUrl: '', condition: '', isbn: '', status: BookStatus.AVAILABLE, price: undefined, currency: 'USD' }]);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

  const bookLimit = expert.subscriptionTier === SubscriptionTier.PREMIUM ? PREMIUM_BOOK_LIMIT : FREE_BOOK_LIMIT;
  const canAddMoreBooks = books.length < bookLimit;

  const handleAddBookField = () => {
    if (canAddMoreBooks) {
        setBooks([...books, { title: '', author: '', year: undefined, imageUrl: '', condition: '', isbn: '', status: BookStatus.AVAILABLE, price: undefined, currency: 'USD' }]);
    } else {
        const message = expert.subscriptionTier === SubscriptionTier.PREMIUM
            ? `You have reached your premium limit of ${PREMIUM_BOOK_LIMIT} books.`
            : `You have reached your limit of ${FREE_BOOK_LIMIT} books for the free tier. Upgrade to Premium to list up to ${PREMIUM_BOOK_LIMIT} books.`;
        alert(message);
    }
  };

  const validateIsbn = (isbn: string): string | undefined => {
    if (!isbn) return undefined; // Allow empty ISBN
    const sanitized = isbn.replace(/-/g, '').trim();
    if (!/^\d+$/.test(sanitized)) {
        return 'ISBN can only contain digits and hyphens.';
    }
    if (sanitized.length !== 10 && sanitized.length !== 13) {
        return 'Valid ISBN must be 10 or 13 digits.';
    }
    return undefined; // No error
  }

  const handleBookChange = (index: number, field: keyof Book, value: string | number | BookStatus) => {
    const newBooks = [...books];
    const currentBook = newBooks[index] || {};
    newBooks[index] = { ...currentBook, [field]: value };
    
    if (field === 'isbn') {
        newBooks[index].isbnError = validateIsbn(value as string);
    }
    setBooks(newBooks);
  };

  const BOOK_COVER_MAX_WIDTH = 800;
  const BOOK_COVER_MAX_HEIGHT = 1000;

  const handleBookImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoading(prev => ({ ...prev, [index]: true }));
      try {
        const resizedDataUrl = await resizeImage(file, BOOK_COVER_MAX_WIDTH, BOOK_COVER_MAX_HEIGHT);
        handleBookChange(index, 'imageUrl', resizedDataUrl);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("There was an error processing the image. Please try another one.");
      } finally {
        setImageLoading(prev => ({ ...prev, [index]: false }));
      }
    }
  };
  
  const handleRemoveBookField = (index: number) => {
    const newBooks = books.filter((_, i) => i !== index);
    setBooks(newBooks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasErrors = books.some(b => b.isbnError);
    if (hasErrors) {
        alert('Please correct the invalid ISBN formats before saving.');
        return;
    }

    const finalBooks: Book[] = books
      .filter(b => b.title && b.author && b.year)
      .map((b, index) => ({
        id: b.id || `new-book-${Date.now()}-${index}`,
        title: b.title!,
        author: b.author!,
        year: Number(b.year!),
        imageUrl: b.imageUrl || undefined,
        condition: b.condition || undefined,
        isbn: b.isbn || undefined,
        status: b.status || BookStatus.AVAILABLE,
        price: b.price ? Number(b.price) : undefined,
        currency: b.currency || undefined,
        addedAt: b.addedAt || new Date().toISOString(),
      }));

    updateExpertBooks(expert.id, finalBooks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4 -mt-8 px-8 -mx-8 border-b z-10">
            <h2 className="text-2xl font-bold text-gray-800">Manage Your Books</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Your Books for Sale</h3>
                <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {books.length} / {bookLimit} Books Listed
                </div>
            </div>
            {books.map((book, index) => (
              <div key={index} className="p-4 border rounded-md relative mb-4 bg-gray-50/50">
                {books.length > 0 && (
                    <div className="absolute top-0 right-0">
                        <button type="button" onClick={() => handleRemoveBookField(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-light leading-none">
                        &times;
                        </button>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-full sm:w-auto">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image</label>
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-36 bg-gray-100 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                                {imageLoading[index] ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-customBlue-600"></div>
                                ) : book.imageUrl ? (
                                    <img src={book.imageUrl} alt="Cover preview" className="h-full w-full object-cover" />
                                ) : (
                                    <BookIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <label htmlFor={`book-cover-upload-${index}`} className="cursor-pointer text-center bg-white py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50">
                                <span>Upload</span>
                                <input id={`book-cover-upload-${index}`} name={`book-cover-upload-${index}`} type="file" className="sr-only" accept="image/*" onChange={(e) => handleBookImageChange(e, index)} />
                            </label>
                        </div>
                    </div>
                    <div className="flex-grow w-full space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Title</label>
                            <input type="text" value={book.title || ''} onChange={e => handleBookChange(index, 'title', e.target.value)} required className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Author</label>
                                <input type="text" value={book.author || ''} onChange={e => handleBookChange(index, 'author', e.target.value)} required className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"/>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Year</label>
                                <input type="number" value={book.year || ''} onChange={e => handleBookChange(index, 'year', Number(e.target.value))} required className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-medium text-gray-600">Price</label>
                                <input 
                                    type="number" 
                                    value={book.price || ''} 
                                    onChange={e => handleBookChange(index, 'price', e.target.value ? parseFloat(e.target.value) : undefined)} 
                                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
                                    placeholder="e.g., 25.50"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Currency</label>
                                <input 
                                    type="text" 
                                    value={book.currency || ''} 
                                    onChange={e => handleBookChange(index, 'currency', e.target.value.toUpperCase())} 
                                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
                                    placeholder="e.g., USD"
                                    maxLength={3}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-medium text-gray-600">ISBN</label>
                                <input 
                                    type="text" 
                                    value={book.isbn || ''} 
                                    onChange={e => handleBookChange(index, 'isbn', e.target.value)} 
                                    className={`mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:ring-customBlue-600 ${book.isbnError ? 'border-red-500 ring-red-500 focus:border-red-500' : 'focus:border-customBlue-600'}`}
                                    placeholder="e.g., 978-3-16-148410-0"
                                />
                                {book.isbnError && <p className="text-xs text-red-600 mt-1">{book.isbnError}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Status</label>
                                <select 
                                    value={book.status || BookStatus.AVAILABLE} 
                                    onChange={e => handleBookChange(index, 'status', e.target.value as BookStatus)} 
                                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
                                >
                                    {Object.values(BookStatus).map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-gray-600">Condition</label>
                            <textarea value={book.condition || ''} onChange={e => handleBookChange(index, 'condition', e.target.value)} rows={2} className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm" placeholder="e.g., Like new, slight wear on cover..."></textarea>
                        </div>
                    </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddBookField} disabled={!canAddMoreBooks} className="mt-4 text-sm text-customBlue-600 hover:text-customBlue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              + Add another book
            </button>
          </div>

          <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBooksForm;