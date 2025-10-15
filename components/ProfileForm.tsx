import React, { useState, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Book, BookGenre, Expert, SocialLinks } from '../types';
import { generateBio, resizeImage } from '../services/geminiService';
import { COUNTRIES } from '../constants';

interface ProfileFormProps {
  onClose: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onClose }) => {
  const { addExpert, isLoading, setIsLoading } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [genre, setGenre] = useState<BookGenre>(BookGenre.ART);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [country, setCountry] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ x: '', facebook: '', linkedIn: '', instagram: '', youtube: '' });

  
  const AVATAR_MAX_WIDTH = 800;
  const AVATAR_MAX_HEIGHT = 800;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const resizedDataUrl = await resizeImage(file, AVATAR_MAX_WIDTH, AVATAR_MAX_HEIGHT);
        setAvatarUrl(resizedDataUrl);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("There was an error processing the image. Please try another one.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGenerateBio = useCallback(async () => {
    if (!name || !genre) {
      alert('Please enter your name and select a genre first.');
      return;
    }
    setIsLoading(true);
    try {
      const generated = await generateBio(name, genre);
      setBio(generated);
    } catch (error) {
      console.error("Failed to generate bio", error);
      alert('Could not generate bio. Please try again or write your own.');
    } finally {
      setIsLoading(false);
    }
  }, [name, genre, setIsLoading]);

  const handleSocialChange = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up social links to ensure they are valid URLs or undefined
    const finalSocialLinks: SocialLinks = Object.entries(socialLinks).reduce((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        acc[key as keyof SocialLinks] = value.trim();
      }
      return acc;
    }, {} as SocialLinks);


    const newExpertData = {
      name,
      email: email.trim(),
      genre,
      bio,
      avatarUrl: avatarUrl || `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/400`,
      country: country || undefined,
      socialLinks: Object.keys(finalSocialLinks).length > 0 ? finalSocialLinks : undefined,
    };

    const success = await addExpert(newExpertData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4 -mt-8 px-8 -mx-8 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Become a GO2 Expert</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" />
            </div>
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700">GO2 Expertise</label>
              <select id="genre" value={genre} onChange={e => setGenre(e.target.value as BookGenre)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600">
                {Object.values(BookGenre).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
              <select id="country" value={country} onChange={e => setCountry(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600">
                  <option value="">-- Select a country --</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Avatar Photo</label>
              <div className="mt-1 flex items-center">
                <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
                </span>
                <label htmlFor="file-upload" className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-customBlue-600 cursor-pointer">
                    <span>Change</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Expert Bio</label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"></textarea>
            <button type="button" onClick={handleGenerateBio} disabled={isLoading} className="mt-2 text-sm text-customBlue-600 hover:text-customBlue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Processing...' : '✨ Generate with AI'}
            </button>
          </div>
          
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Presence (Optional)</h3>
             <div className="space-y-4">
                <div>
                    <label htmlFor="social-x" className="block text-sm font-medium text-gray-700">X (Twitter) Profile URL</label>
                    <input type="url" id="social-x" value={socialLinks.x} onChange={e => handleSocialChange('x', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://x.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-facebook" className="block text-sm font-medium text-gray-700">Facebook Profile URL</label>
                    <input type="url" id="social-facebook" value={socialLinks.facebook} onChange={e => handleSocialChange('facebook', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://facebook.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-linkedin" className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                    <input type="url" id="social-linkedin" value={socialLinks.linkedIn} onChange={e => handleSocialChange('linkedIn', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://linkedin.com/in/username"/>
                </div>
                 <div>
                    <label htmlFor="social-instagram" className="block text-sm font-medium text-gray-700">Instagram Profile URL</label>
                    <input type="url" id="social-instagram" value={socialLinks.instagram} onChange={e => handleSocialChange('instagram', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://instagram.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-youtube" className="block text-sm font-medium text-gray-700">YouTube Channel URL</label>
                    <input type="url" id="social-youtube" value={socialLinks.youtube} onChange={e => handleSocialChange('youtube', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://youtube.com/c/channelname"/>
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700">Create Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;