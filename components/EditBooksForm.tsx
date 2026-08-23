import React, { useState } from 'react';
import { Book, Expert } from '../types';
import { SparklesIcon, TrashIcon, UploadIcon } from './icons';
import { scanBookCover, resizeImage } from '../services/geminiService';
import { useAppContext } from '../hooks/useAppContext';
import { FREE_BOOK_LIMIT, PREMIUM_BOOK_LIMIT } from '../constants';

interface EditBooksFormProps {
  expert: Expert;
  onSave: (updatedBooks: Book[]) => void;
  onCancel: () => void;
}

const EditBooksForm: React.FC<EditBooksFormProps> = ({ expert, onSave, onCancel }) => {
  const { isScanning, setIsScanning } = useAppContext();
  const [books, setBooks] = useState<Book[]>(expert.books || []);
  const [activeScanningIndex, setActiveScanningIndex] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});
  
  const isPremium = expert.subscriptionTier === 'premium';
  const bookLimit = isPremium ? PREMIUM_BOOK_LIMIT : FREE_BOOK_LIMIT;

  const handleBookChange = (index: number, field: keyof Book, value: any) => {
    const newBooks = [...books];
    newBooks[index] = { ...newBooks[index], [field]: value };
    setBooks(newBooks);
  };

  const handleAddBook = () => {
    if (books.length >= bookLimit) {
        alert(`You have reached the maximum limit of ${bookLimit} books for your ${expert.subscriptionTier} tier.`);
        return;
    }
    const newBook: Book = {
      id: `b_${Date.now()}`,
      title: '',
      author: '',
      price: 0,
      currency: 'EUR',
      condition: 'Good',
      description: '',
      imageUrl: '',
      isSpotlight: false,
    };
    setBooks([...books, newBook]);
  };

  const handleRemoveBook = (index: number) => {
    const newBooks = books.filter((_, i) => i !== index);
    setBooks(newBooks);
  };

  const BOOK_COVER_MAX_WIDTH = 320;
  const BOOK_COVER_MAX_HEIGHT = 440;

  const handleBookImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoading(prev => ({ ...prev, [index]: true }));
      try {
        const resizedDataUrl = await resizeImage(file, BOOK_COVER_MAX_WIDTH, BOOK_COVER_MAX_HEIGHT, 0.65);
        handleBookChange(index, 'imageUrl', resizedDataUrl);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("Failed to process image. Please try another one.");
      } finally {
        setImageLoading(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const handleScanCover = async (index: number, file: File) => {
      setIsScanning(true);
      setActiveScanningIndex(index);
      try {
          const { title, author } = await scanBookCover(file);
          if (title) handleBookChange(index, 'title', title);
          if (author) handleBookChange(index, 'author', author);
      } catch (error) {
          console.error("Error scanning cover:", error);
          alert("Could not scan the book cover. Please enter details manually.");
      } finally {
          setIsScanning(false);
          setActiveScanningIndex(null);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(books);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">
            Manage Books ({books.length}/{bookLimit})
        </h2>
        <button
          type="button"
          onClick={handleAddBook}
          disabled={books.length >= bookLimit}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
            books.length >= bookLimit
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-customBlue-600 hover:bg-customBlue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-customBlue-600'
          }`}
        >
          + Add Book
        </button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {books.map((book, index) => (
          <div key={book.id || index} className="p-4 border rounded-lg bg-gray-50 relative space-y-4">
            <button
              type="button"
              onClick={() => handleRemoveBook(index)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Image Section */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-2 relative">
                    {book.imageUrl ? (
                        <div className="relative group w-full h-40">
                            <img src={book.imageUrl} alt="Cover" className="w-full h-full object-contain rounded" />
                            <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer text-white text-xs transition-opacity rounded">
                                Change Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleBookImageChange(e, index)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 cursor-pointer">
                            <UploadIcon className="w-8 h-8 text-gray-400" />
                            <span className="text-xs text-gray-500 mt-2">Upload Cover</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBookImageChange(e, index)}
                                className="hidden"
                            />
                        </label>
                    )}
                    {imageLoading[index] && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                            <span className="text-xs font-semibold text-customBlue-600">Processing...</span>
                        </div>
                    )}
                     <div className="mt-2 w-full">
                        <label className="flex items-center justify-center w-full px-2 py-1 text-xs font-medium text-customBlue-700 bg-customBlue-100 hover:bg-customBlue-200 rounded cursor-pointer">
                            <SparklesIcon className="w-3 h-3 mr-1" />
                            Auto-fill with AI
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleBookImageChange(e, index);
                                        handleScanCover(index, file);
                                    }
                                }}
                                className="hidden"
                                disabled={isScanning}
                            />
                        </label>
                    </div>
                </div>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={book.title}
                            onChange={(e) => handleBookChange(index, 'title', e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                            placeholder="Book Title"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Author</label>
                        <input
                            type="text"
                            value={book.author}
                            onChange={(e) => handleBookChange(index, 'author', e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                            placeholder="Author Name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Price (EUR)</label>
                            <input
                                type="number"
                                value={book.price}
                                onChange={(e) => handleBookChange(index, 'price', parseFloat(e.target.value) || 0)}
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Condition</label>
                            <select
                                value={book.condition}
                                onChange={(e) => handleBookChange(index, 'condition', e.target.value as any)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                            >
                                <option value="New">New</option>
                                <option value="Like New">Like New</option>
                                <option value="Very Good">Very Good</option>
                                <option value="Good">Good</option>
                                <option value="Acceptable">Acceptable</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-700">Description / Notes</label>
                        <textarea
                            value={book.description}
                            onChange={(e) => handleBookChange(index, 'description', e.target.value)}
                            rows={2}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                            placeholder="Add condition details, edition info, etc."
                        />
                    </div>
                </div>
            </div>
          </div>
        ))}
        {books.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
                No books added yet. Click "+ Add Book" to begin building your list.
            </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-customBlue-600 hover:bg-customBlue-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditBooksForm;
