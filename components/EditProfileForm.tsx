import React, { useState, useCallback } from 'react';
import { Expert, Book, SocialLinks } from '../types';
import { SparklesIcon, UploadIcon } from './icons';
import { generateBio, resizeImage } from '../services/geminiService';
import { useAppContext } from '../hooks/useAppContext';
import { FREE_SPOTLIGHT_LIMIT, PREMIUM_SPOTLIGHT_LIMIT } from '../constants';

interface EditProfileFormProps {
  expert: Expert;
  onSave: (updatedProfile: Partial<Expert>) => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ expert, onSave, onCancel }) => {
  const { isScanning, setIsScanning } = useAppContext();
  
  const [name, setName] = useState(expert.name);
  const [genre, setGenre] = useState(expert.genre);
  const [avatarUrl, setAvatarUrl] = useState(expert.avatarUrl);
  const [bio, setBio] = useState(expert.bio);
  const [location, setLocation] = useState(expert.location || '');
  const [deliveryNote, setDeliveryNote] = useState(expert.deliveryNote || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(expert.socialLinks || {
    x: '',
    facebook: '',
    linkedIn: '',
    instagram: '',
    youtube: '',
  });
  
  // Direct communication options
  const [directPhone, setDirectPhone] = useState(expert.directPhone || '');
  const [directEmail, setDirectEmail] = useState(expert.directEmail || '');
  const [contactPreference, setContactPreference] = useState<'platform' | 'direct' | 'both'>(expert.contactPreference || 'platform');

  const [books, setBooks] = useState<Book[]>(expert.books || []);
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = expert.subscriptionTier === 'premium';
  const spotlightLimit = isPremium ? PREMIUM_SPOTLIGHT_LIMIT : FREE_SPOTLIGHT_LIMIT;

  
  const AVATAR_MAX_WIDTH = 256;
  const AVATAR_MAX_HEIGHT = 256;

  const handleGenerateBio = useCallback(async () => {
    if (!name || !genre) {
      alert("Please provide both Name and Genre to generate a bio.");
      return;
    }
    setIsScanning(true);
    try {
      const generated = await generateBio(name, genre);
      setBio(generated);
    } catch (error) {
      console.error("Error generating bio:", error);
      alert("Failed to generate bio with AI. Please try again or write it manually.");
    } finally {
      setIsScanning(false);
    }
  }, [name, genre, setIsScanning]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const resizedDataUrl = await resizeImage(file, AVATAR_MAX_WIDTH, AVATAR_MAX_HEIGHT, 0.7);
        setAvatarUrl(resizedDataUrl);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("Failed to process image. Please try another one.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSpotlightToggle = (bookId: string) => {
    const currentSpotlights = books.filter(b => b.isSpotlight);
    const book = books.find(b => b.id === bookId);

    if (!book) return;

    if (!book.isSpotlight && currentSpotlights.length >= spotlightLimit) {
      alert(`You can only spotlight up to ${spotlightLimit} books in your ${expert.subscriptionTier} tier.`);
      return;
    }

    setBooks(books.map(b => 
      b.id === bookId ? { ...b, isSpotlight: !b.isSpotlight } : b
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      genre,
      avatarUrl,
      bio,
      location,
      deliveryNote,
      socialLinks,
      directPhone,
      directEmail,
      contactPreference,
      books,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Edit Profile & Spotlight</h2>
      </div>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Avatar Upload */}
        <div className="flex items-center space-x-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <UploadIcon className="w-8 h-8" />
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <span className="text-xs font-semibold text-customBlue-600">Processing...</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
            <label className="mt-1 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              Upload New Photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 2MB</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialty Genre</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
              placeholder="e.g. Science Fiction, Rare First Editions"
            />
          </div>
        </div>

        {/* Bio with AI Generation */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Biography</label>
            <button
              type="button"
              onClick={handleGenerateBio}
              disabled={isScanning}
              className="inline-flex items-center text-xs font-medium text-customBlue-600 hover:text-customBlue-700"
            >
              <SparklesIcon className="w-3.5 h-3.5 mr-1" />
              Generate with AI
            </button>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
            placeholder="Tell buyers about your passion, experience, and what makes your collection unique..."
          />
        </div>

        {/* Location & Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location (City, Country)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
              placeholder="e.g. London, UK"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery / Shipping Note</label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
              placeholder="e.g. Worldwide shipping, Free local pickup"
            />
          </div>
        </div>

        {/* Direct Contact Options */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Direct Contact Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Direct Phone / WhatsApp</label>
              <input
                type="text"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                placeholder="+1 234 567 890"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Public Contact Email</label>
              <input
                type="email"
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
                placeholder="contact@mybooks.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Contact Preference</label>
              <select
                value={contactPreference}
                onChange={(e) => setContactPreference(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-sm"
              >
                <option value="platform">Platform Inquiry Form Only</option>
                <option value="direct">Direct Contact Only</option>
                <option value="both">Both Form & Direct Info</option>
              </select>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Social Profiles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">X (Twitter) URL</label>
              <input
                type="url"
                value={socialLinks.x || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-xs"
                placeholder="https://x.com/username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Instagram URL</label>
              <input
                type="url"
                value={socialLinks.instagram || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-xs"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Facebook URL</label>
              <input
                type="url"
                value={socialLinks.facebook || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600 text-xs"
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>
        </div>

        {/* Spotlight Management */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Spotlight Titles</h3>
              <p className="text-xs text-gray-500">
                Choose up to {spotlightLimit} featured books to display prominently at the top of your profile.
              </p>
            </div>
            <span className="text-xs font-medium bg-customBlue-100 text-customBlue-800 px-2 py-1 rounded">
              {books.filter(b => b.isSpotlight).length} / {spotlightLimit} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border rounded-md bg-gray-50">
            {books.map((book) => (
              <label
                key={book.id}
                className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                  book.isSpotlight ? 'bg-customBlue-50 border-customBlue-600' : 'bg-white border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!book.isSpotlight}
                  onChange={() => handleSpotlightToggle(book.id)}
                  className="rounded border-gray-300 text-customBlue-600 focus:ring-customBlue-600 mr-2"
                />
                <div className="truncate flex-1">
                  <div className="text-xs font-medium text-gray-900 truncate">{book.title}</div>
                  <div className="text-[10px] text-gray-500 truncate">{book.author}</div>
                </div>
              </label>
            ))}
            {books.length === 0 && (
              <p className="col-span-full text-center text-xs text-gray-500 py-4">
                No books in your collection yet. Add books first to spotlight them.
              </p>
            )}
          </div>
        </div>
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
          Save Profile
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;
