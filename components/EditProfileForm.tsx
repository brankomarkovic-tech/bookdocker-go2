import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Expert, BookGenre, SocialLinks, SpotlightItem, SubscriptionTier } from '../types';
import { MicrophoneIcon, StopCircleIcon, TrashIcon, PlayIcon, PauseIcon, BookIcon } from './icons';
import { generateBio, resizeImage } from '../services/geminiService';
import { COUNTRIES, SPOTLIGHT_LIMIT_FREE, SPOTLIGHT_LIMIT_PREMIUM } from '../constants';

interface EditProfileFormProps {
  expert: Expert;
  onClose: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ expert, onClose }) => {
  const { updateExpertProfile, isLoading, setIsLoading } = useAppContext();
  
  const [name, setName] = useState(expert.name);
  const [genre, setGenre] = useState<BookGenre>(expert.genre);
  const [bio, setBio] = useState(expert.bio);
  const [avatarUrl, setAvatarUrl] = useState(expert.avatarUrl);
  const [country, setCountry] = useState(expert.country || '');
  const [city, setCity] = useState(expert.city || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(expert.socialLinks || {});
  const [onLeave, setOnLeave] = useState(expert.onLeave || false);
  const [audioIntroUrl, setAudioIntroUrl] = useState<string | undefined>(expert.audioIntroUrl);
  const [spotlights, setSpotlights] = useState<Partial<SpotlightItem>[]>(expert.spotlights || []);
  const [spotlightImageLoading, setSpotlightImageLoading] = useState<Record<number, boolean>>({});

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio Playback State for Preview
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isPremium = expert.subscriptionTier === SubscriptionTier.PREMIUM;
  const spotlightLimit = isPremium ? SPOTLIGHT_LIMIT_PREMIUM : SPOTLIGHT_LIMIT_FREE;
  const canAddMoreSpotlights = spotlights.length < spotlightLimit;

  const AVATAR_MAX_WIDTH = 256;
  const AVATAR_MAX_HEIGHT = 256;
  const SPOTLIGHT_MAX_WIDTH = 320;
  const SPOTLIGHT_MAX_HEIGHT = 440;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const resizedDataUrl = await resizeImage(file, AVATAR_MAX_WIDTH, AVATAR_MAX_HEIGHT, 0.7);
        setAvatarUrl(resizedDataUrl);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("There was an error processing the image. Please try another one.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSpotlightImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setSpotlightImageLoading(prev => ({ ...prev, [index]: true }));
      try {
        const resizedDataUrl = await resizeImage(file, SPOTLIGHT_MAX_WIDTH, SPOTLIGHT_MAX_HEIGHT, 0.65);
        handleSpotlightChange(index, 'imageUrl', resizedDataUrl);
      } catch (error) {
        console.error("Error resizing spotlight image:", error);
        alert("There was an error processing the image. Please try another one.");
      } finally {
        setSpotlightImageLoading(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const handleGenerateBio = useCallback(async () => {
    if (!name || !genre) {
      alert('Please ensure your name and genre are filled in.');
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

  const handleAddSpotlight = () => {
    if (canAddMoreSpotlights) {
      setSpotlights([...spotlights, { title: '', author: '', description: '', imageUrl: '' }]);
    } else {
      alert(`You can only have up to ${spotlightLimit} spotlight items on your plan.`);
    }
  };

  const handleRemoveSpotlight = (index: number) => {
    setSpotlights(spotlights.filter((_, i) => i !== index));
  };

  const handleSpotlightChange = (index: number, field: keyof SpotlightItem, value: string) => {
    const updated = [...spotlights];
    updated[index] = { ...updated[index], [field]: value };
    setSpotlights(updated);
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioIntroUrl(reader.result as string);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioIntroUrl(undefined);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  const togglePlayPreview = () => {
    if (!audioIntroUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioIntroUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSocialLinks: SocialLinks = Object.entries(socialLinks).reduce((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        acc[key as keyof SocialLinks] = value.trim();
      }
      return acc;
    }, {} as SocialLinks);

    const finalSpotlights: SpotlightItem[] = spotlights
      .filter(s => s.title && s.author)
      .map((s, idx) => ({
        id: s.id || `spotlight-${Date.now()}-${idx}`,
        title: s.title!,
        author: s.author!,
        description: s.description || '',
        imageUrl: s.imageUrl || '',
      }));

    const profileData: Partial<Expert> = {
      name,
      genre,
      bio,
      avatarUrl,
      country: country || undefined,
      city: city || undefined,
      socialLinks: Object.keys(finalSocialLinks).length > 0 ? finalSocialLinks : undefined,
      onLeave,
      audioIntroUrl: audioIntroUrl || undefined,
      spotlights: finalSpotlights,
    };

    const success = await updateExpertProfile(expert.id, profileData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4 -mt-8 px-8 -mx-8 border-b z-10">
            <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" />
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
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City (Optional)</label>
              <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="e.g., London, New York" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Avatar Photo</label>
              <div className="mt-1 flex items-center">
                <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
                </span>
                <label htmlFor="avatar-file-upload" className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-customBlue-600 cursor-pointer">
                    <span>Change Avatar</span>
                    <input id="avatar-file-upload" name="avatar-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="onLeave" 
                  checked={onLeave} 
                  onChange={e => setOnLeave(e.target.checked)} 
                  className="h-4 w-4 text-customBlue-600 focus:ring-customBlue-600 border-gray-300 rounded"
                />
                <label htmlFor="onLeave" className="ml-2 block text-sm font-medium text-gray-700">
                  Mark profile as <strong>On Leave / Away</strong> (lets collectors know you are currently unavailable)
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

          {/* Voice Introduction Section */}
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Introduction / Audio Greeting (Optional)</h3>
            <p className="text-xs text-gray-600 mb-4">Record a short personal greeting (up to 60 seconds) for your profile visitors.</p>
            
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center space-x-2 py-2 px-4 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                  <span>{audioIntroUrl ? 'Record New Voice Greeting' : 'Record Voice Greeting'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center space-x-2 py-2 px-4 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 shadow-sm animate-pulse"
                >
                  <StopCircleIcon className="w-5 h-5" />
                  <span>Stop Recording</span>
                </button>
              )}

              {audioIntroUrl && !isRecording && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={togglePlayPreview}
                    className="flex items-center space-x-1 py-2 px-3 bg-customBlue-600 text-white rounded-md text-sm font-medium hover:bg-customBlue-700"
                  >
                    {isPlayingPreview ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    <span>{isPlayingPreview ? 'Pause' : 'Play Preview'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteAudio}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                    title="Delete Audio"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Spotlight Editions Section */}
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Spotlight Rare Editions</h3>
                <p className="text-xs text-gray-600">Feature special highlight books on your profile ({spotlights.length}/{spotlightLimit} used).</p>
              </div>
              <button
                type="button"
                onClick={handleAddSpotlight}
                disabled={!canAddMoreSpotlights}
                className="text-sm text-customBlue-600 hover:text-customBlue-800 font-semibold disabled:opacity-50"
              >
                + Add Spotlight
              </button>
            </div>

            {spotlights.map((spotlight, index) => (
              <div key={index} className="p-4 border rounded-md mb-4 bg-white relative">
                <div className="absolute top-2 right-2">
                  <button type="button" onClick={() => handleRemoveSpotlight(index)} className="text-red-500 hover:text-red-700 text-xl font-bold">
                    &times;
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-28 bg-gray-100 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                      {spotlightImageLoading[index] ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-customBlue-600"></div>
                      ) : spotlight.imageUrl ? (
                        <img src={spotlight.imageUrl} alt="Spotlight preview" className="h-full w-full object-cover" />
                      ) : (
                        <BookIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label htmlFor={`spotlight-image-${index}`} className="cursor-pointer text-center bg-white py-1 px-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <span>Upload</span>
                      <input id={`spotlight-image-${index}`} name={`spotlight-image-${index}`} type="file" className="sr-only" accept="image/*" onChange={(e) => handleSpotlightImageChange(e, index)} />
                    </label>
                  </div>

                  <div className="flex-grow w-full space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Title</label>
                      <input type="text" value={spotlight.title || ''} onChange={e => handleSpotlightChange(index, 'title', e.target.value)} required className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm" placeholder="e.g., First Folio Edition" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Author</label>
                      <input type="text" value={spotlight.author || ''} onChange={e => handleSpotlightChange(index, 'author', e.target.value)} required className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm" placeholder="Author name" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Special Notes</label>
                      <textarea value={spotlight.description || ''} onChange={e => handleSpotlightChange(index, 'description', e.target.value)} rows={2} className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm" placeholder="Why this copy is unique or rare..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Social Presence Section */}
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Presence (Optional)</h3>
             <div className="space-y-4">
                <div>
                    <label htmlFor="social-x" className="block text-sm font-medium text-gray-700">X (Twitter) Profile URL</label>
                    <input type="url" id="social-x" value={socialLinks.x || ''} onChange={e => handleSocialChange('x', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://x.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-facebook" className="block text-sm font-medium text-gray-700">Facebook Profile URL</label>
                    <input type="url" id="social-facebook" value={socialLinks.facebook || ''} onChange={e => handleSocialChange('facebook', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://facebook.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-linkedin" className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                    <input type="url" id="social-linkedin" value={socialLinks.linkedIn || ''} onChange={e => handleSocialChange('linkedIn', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://linkedin.com/in/username"/>
                </div>
                 <div>
                    <label htmlFor="social-instagram" className="block text-sm font-medium text-gray-700">Instagram Profile URL</label>
                    <input type="url" id="social-instagram" value={socialLinks.instagram || ''} onChange={e => handleSocialChange('instagram', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://instagram.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-youtube" className="block text-sm font-medium text-gray-700">YouTube Channel URL</label>
                    <input type="url" id="social-youtube" value={socialLinks.youtube || ''} onChange={e => handleSocialChange('youtube', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600" placeholder="https://youtube.com/c/channelname"/>
                </div>
             </div>
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

export default EditProfileForm;
