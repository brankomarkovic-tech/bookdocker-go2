import React, { useState } from 'react';
import { Expert, SocialLinks } from '../types';
import { UploadIcon } from './icons';
import { resizeImage } from '../services/geminiService';

interface ProfileFormProps {
  onSubmit: (expertData: Omit<Expert, 'id' | 'createdAt' | 'status' | 'role' | 'subscriptionTier' | 'books'>) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ x: '', facebook: '', linkedIn: '', instagram: '', youtube: '' });

  
  const AVATAR_MAX_WIDTH = 256;
  const AVATAR_MAX_HEIGHT = 256;

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

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      genre,
      email,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
      bio,
      location,
      deliveryNote,
      socialLinks,
      contactPreference: 'platform'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <UploadIcon className="w-6 h-6" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Profile Photo</label>
          <label className="mt-1 inline-flex items-center px-2 py-1 border border-gray-300 text-xs rounded text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            Upload
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Specialty Genre</label>
        <input
          type="text"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          required
          placeholder="e.g. Classic Literature, Science Fiction"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Short Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          required
          placeholder="Introduce yourself and your curation focus..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Delivery Notes</label>
          <input
            type="text"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="e.g. Worldwide shipping"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-3 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-1.5 bg-customBlue-600 text-white rounded text-xs font-medium hover:bg-customBlue-700"
        >
          Apply for Expert Profile
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
