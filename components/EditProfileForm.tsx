import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BookGenre, Expert, SocialLinks, BookQuery, SubscriptionTier, Spotlight, PresentOffer, BookStatus } from '../types';
import { generateBio, resizeImage } from '../services/geminiService';
import { COUNTRIES, FREE_SPOTLIGHT_LIMIT, PREMIUM_SPOTLIGHT_LIMIT } from '../constants';
import { MicrophoneIcon, StopCircleIcon, TrashIcon, BuzzIcon, HoneycombIcon, PresentIcon } from './icons';

interface EditProfileFormProps {
  expert: Expert;
  onClose: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ expert, onClose }) => {
  const { updateExpertProfile, isLoading, setIsLoading } = useAppContext();
  
  const [name, setName] = useState(expert.name);
  const [email, setEmail] = useState(expert.email);
  const [genre, setGenre] = useState<BookGenre>(expert.genre || BookGenre.ART);
  const [bio, setBio] = useState(expert.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(expert.avatarUrl);
  const [country, setCountry] = useState(expert.country || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(expert.socialLinks || { x: '', facebook: '', linkedIn: '', instagram: '', youtube: '' });
  const [bookQuery, setBookQuery] = useState<Partial<BookQuery>>(expert.bookQuery || { title: '', author: '', publisher: '', edition: '', year: undefined });
  
  // Premium Features State
  const [onLeave, setOnLeave] = useState(expert.onLeave || false);
  const [spotlights, setSpotlights] = useState<Partial<Spotlight>[]>((expert.spotlights || []).length > 0 ? expert.spotlights! : [{id: crypto.randomUUID(), title: '', content: ''}]);
  const [presentOffer, setPresentOffer] = useState<Partial<PresentOffer>>(expert.presentOffer || { bookId: '', booksRequired: undefined });

  // State for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const MAX_RECORDING_TIME_S = 100;

  const isPremium = expert.subscriptionTier === SubscriptionTier.PREMIUM;
  const spotlightLimit = isPremium ? PREMIUM_SPOTLIGHT_LIMIT : FREE_SPOTLIGHT_LIMIT;

  
  const AVATAR_MAX_WIDTH = 800;
  const AVATAR_MAX_HEIGHT = 800;

  const handleGenerateBio = useCallback(async () => {
    if (!name || !genre) {
      alert('Please enter a name and select a genre first.');
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

  const handleSocialChange = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };
  
  const handleBookQueryChange = (field: keyof BookQuery, value: string | number | undefined) => {
    setBookQuery(prev => ({ ...prev, [field]: value }));
  };

    const handleSpotlightChange = (index: number, field: keyof Spotlight, value: string) => {
        const newSpotlights = [...spotlights];
        newSpotlights[index] = {...newSpotlights[index], [field]: value};
        setSpotlights(newSpotlights);
    }
    const handleAddSpotlight = () => {
        if(spotlights.length < spotlightLimit) {
            setSpotlights([...spotlights, {id: crypto.randomUUID(), title: '', content: ''}]);
        }
    }
    const handleRemoveSpotlight = (index: number) => {
        setSpotlights(spotlights.filter((_, i) => i !== index));
    }
    
    const handlePresentOfferChange = (field: keyof PresentOffer, value: string | number) => {
        setPresentOffer(prev => ({...prev, [field]: value}));
    }


  // --- Audio Recording Handlers ---
  const handleStartRecording = async (index: number) => {
    setAudioError(null);
    setRecordingTime(0);
    setRecordingIndex(index);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const audioChunks: Blob[] = [];
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => { audioChunks.push(event.data); };

        mediaRecorderRef.current.onstop = () => {
          if (audioChunks.length > 0) {
            const mimeType = audioChunks[0].type;
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const newSpotlights = [...spotlights];
                newSpotlights[index].audioUrl = reader.result as string;
                setSpotlights(newSpotlights);
            };
          }
          if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
          if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
        };

        mediaRecorderRef.current.start();
        timerIntervalRef.current = window.setInterval(() => {
          setRecordingTime(prevTime => {
            const newTime = prevTime + 1;
            if (newTime >= MAX_RECORDING_TIME_S) { handleStopRecording(); }
            return newTime;
          });
        }, 1000);

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setAudioError("Could not access microphone. Please check permissions and try again.");
      }
    } else {
      setAudioError("Audio recording is not supported by your browser.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    setRecordingTime(0);
    setRecordingIndex(null);
  };

  const handleDeleteRecording = (index: number) => {
    if (recordingIndex === index) { handleStopRecording(); }
    const newSpotlights = [...spotlights];
    newSpotlights[index].audioUrl = undefined;
    setSpotlights(newSpotlights);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSocialLinks: SocialLinks = Object.entries(socialLinks).reduce((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim()) { acc[key as keyof SocialLinks] = value.trim(); }
      return acc;
    }, {} as SocialLinks);

    const finalBookQuery: BookQuery | undefined = (bookQuery.title && bookQuery.title.trim() && bookQuery.author && bookQuery.author.trim()) 
    ? { title: bookQuery.title.trim(), author: bookQuery.author.trim(), publisher: bookQuery.publisher?.trim() || undefined, edition: bookQuery.edition?.trim() || undefined, year: bookQuery.year || undefined } : undefined;
    
    const finalSpotlights = spotlights
        .filter(s => s.title && s.content)
        .map(s => ({
            id: s.id || crypto.randomUUID(),
            title: s.title!,
            content: s.content!,
            audioUrl: s.audioUrl,
            featuredBookId: s.featuredBookId,
        }));

    const finalPresentOffer: PresentOffer | undefined = (presentOffer.bookId && presentOffer.booksRequired && presentOffer.booksRequired > 0) 
    ? { bookId: presentOffer.bookId, booksRequired: Number(presentOffer.booksRequired), message: presentOffer.message?.trim() || undefined } : undefined;


    const profileData: Partial<Expert> = {
        name, email, genre, bio, avatarUrl, country: country || undefined,
        socialLinks: Object.keys(finalSocialLinks).length > 0 ? finalSocialLinks : undefined,
        bookQuery: finalBookQuery,
        spotlights: finalSpotlights,
    };
    
    // Premium features are only included in the update payload if the expert is premium.
    if (isPremium) {
      profileData.onLeave = onLeave;
      profileData.presentOffer = finalPresentOffer;
    }

    const success = await updateExpertProfile(expert.id, profileData);
    
    if (success) {
      onClose();
    }
  };
  
  const availableBooks = expert.books?.filter(b => b.status === BookStatus.AVAILABLE) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4 -mt-8 px-8 -mx-8 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Edit Your Profile</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
          </div>
          
          {/* ... Basic Info Fields ... */}
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
                    <input type="url" id="social-x" value={socialLinks.x || ''} onChange={e => handleSocialChange('x', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="https://x.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-facebook" className="block text-sm font-medium text-gray-700">Facebook Profile URL</label>
                    <input type="url" id="social-facebook" value={socialLinks.facebook || ''} onChange={e => handleSocialChange('facebook', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="https://facebook.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-linkedin" className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                    <input type="url" id="social-linkedin" value={socialLinks.linkedIn || ''} onChange={e => handleSocialChange('linkedIn', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="https://linkedin.com/in/username"/>
                </div>
                <div>
                    <label htmlFor="social-instagram" className="block text-sm font-medium text-gray-700">Instagram Profile URL</label>
                    <input type="url" id="social-instagram" value={socialLinks.instagram || ''} onChange={e => handleSocialChange('instagram', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="https://instagram.com/username"/>
                </div>
                <div>
                    <label htmlFor="social-youtube" className="block text-sm font-medium text-gray-700">YouTube Channel URL</label>
                    <input type="url" id="social-youtube" value={socialLinks.youtube || ''} onChange={e => handleSocialChange('youtube', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="https://youtube.com/c/channelname"/>
                </div>
             </div>
          </div>
        
          {/* --- PREMIUM FEATURES --- */}
          {isPremium && (
            <div className="mt-6 p-4 border-2 border-yellow-400 rounded-md bg-yellow-50/50">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-yellow-500">★</span>
                    Premium Settings
                </h3>
                <div className="space-y-6">
                    {/* On Leave Toggle */}
                    <label htmlFor="onLeave" className="flex items-center justify-between p-3 bg-white rounded-md border cursor-pointer">
                        <span className="font-medium text-gray-700">Set "On Leave" Status</span>
                        <div className="relative inline-flex items-center">
                            <input type="checkbox" id="onLeave" checked={onLeave} onChange={() => setOnLeave(!onLeave)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-customBlue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </div>
                    </label>
                    
                    {/* Present Offer */}
                    <div className="p-3 bg-white rounded-md border">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <PresentIcon className="w-5 h-5 text-purple-600"/>
                            Special Offer: Give a Present
                        </label>
                        <p className="text-xs text-gray-500 mb-3">Offer one of your available books as a complimentary gift to a buyer who purchases a certain number of books from you in one order.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="presentOfferBook" className="block text-xs font-medium text-gray-600 mb-1">Gift Book</label>
                                <select
                                    id="presentOfferBook"
                                    value={presentOffer.bookId || ''}
                                    onChange={(e) => handlePresentOfferChange('bookId', e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                                    disabled={availableBooks.length === 0}
                                >
                                    <option value="">-- No Present Offered --</option>
                                    {availableBooks.map(book => (
                                        <option key={book.id} value={book.id}>
                                            {book.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="presentOfferRequired" className="block text-xs font-medium text-gray-600 mb-1">Books to Purchase</label>
                                 <input
                                    type="number"
                                    id="presentOfferRequired"
                                    value={presentOffer.booksRequired || ''}
                                    onChange={(e) => handlePresentOfferChange('booksRequired', Number(e.target.value))}
                                    min="1"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                                    placeholder="e.g., 3"
                                    disabled={!presentOffer.bookId}
                                />
                            </div>
                        </div>
                         <textarea
                            value={presentOffer.message || ''}
                            onChange={(e) => handlePresentOfferChange('message', e.target.value)}
                            rows={2}
                            maxLength={150}
                            className="mt-2 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                            placeholder="Add a friendly message (optional)"
                            disabled={!presentOffer.bookId}
                        ></textarea>
                    </div>
                </div>
            </div>
          )}

          {/* --- SPOTLIGHTS --- */}
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Expert's Spotlight</h3>
                <div className="text-sm font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                    {spotlights.length} / {spotlightLimit}
                </div>
            </div>
            {spotlights.map((spotlight, index) => (
                <div key={spotlight.id || index} className="p-4 border rounded-md relative mb-4 bg-white">
                    <div className="absolute top-1 right-1">
                        <button type="button" onClick={() => handleRemoveSpotlight(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full text-2xl font-light leading-none" title="Remove Spotlight">&times;</button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor={`spotlight-title-${index}`} className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" id={`spotlight-title-${index}`} value={spotlight.title || ''} onChange={e => handleSpotlightChange(index, 'title', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor={`spotlight-book-${index}`} className="block text-sm font-medium text-gray-700">Featured Book (Optional)</label>
                            <select id={`spotlight-book-${index}`} value={spotlight.featuredBookId || ''} onChange={e => handleSpotlightChange(index, 'featuredBookId', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" disabled={!expert.books || expert.books.length === 0}>
                                <option value="">-- No featured book --</option>
                                {expert.books?.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}
                            </select>
                        </div>
                         <div>
                            <div className="flex justify-between items-center">
                                <label htmlFor={`spotlight-content-${index}`} className="block text-sm font-medium text-gray-700">Content</label>
                                <span className="text-xs text-gray-500">{(spotlight.content || '').length} / 350</span>
                            </div>
                            <textarea id={`spotlight-content-${index}`} value={spotlight.content || ''} onChange={e => handleSpotlightChange(index, 'content', e.target.value)} rows={5} maxLength={350} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                        </div>
                        {/* Audio Recording UI */}
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700">Record an Audio Note (Optional)</label>
                            <ul className="list-disc list-inside text-xs text-gray-500 mt-2 space-y-1 pl-2">
                                <li>Introduce yourself and your expertise.</li>
                                <li>Talk about the featured book and why it's special.</li>
                                <li>Keep it concise and engaging (under {MAX_RECORDING_TIME_S} seconds recommended).</li>
                                <li>Speak clearly into your microphone.</li>
                                <li>
                                    Structure the format of your Audio Note: think of it as a tiny podcast episode: have a clear Intro (info about you, feel free to refer to your activity that provides contribution for an actual cause), Main Message (give context to your Expert’s Spotlight), and Outro (express gratitude, add CTA).
                                </li>
                            </ul>
                            {audioError && <p className="text-xs text-red-600 mt-2">{audioError}</p>}
                            <div className="mt-4 flex items-center flex-wrap gap-4">
                                {recordingIndex !== index && !spotlight.audioUrl && (<button type="button" onClick={() => handleStartRecording(index)} className="flex items-center gap-2 py-2 px-4 rounded-md border bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700"><MicrophoneIcon className="w-5 h-5" /> Start</button>)}
                                {recordingIndex === index && (<><button type="button" onClick={handleStopRecording} className="flex items-center gap-2 py-2 px-4 rounded-md border bg-red-600 text-sm font-medium text-white shadow-sm hover:bg-red-700"><StopCircleIcon className="w-5 h-5" /> Stop</button><div className="flex items-center gap-2 text-sm text-red-600 font-semibold"><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span> Rec... ({recordingTime}s / {MAX_RECORDING_TIME_S}s)</div></>)}
                                {spotlight.audioUrl && recordingIndex !== index && (<><audio controls src={spotlight.audioUrl} className="max-w-xs"></audio><button type="button" onClick={() => handleDeleteRecording(index)} title="Delete Recording" className="flex items-center gap-2 py-2 px-3 rounded-md border bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"><TrashIcon className="w-5 h-5 text-red-500" /></button></>)}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
             {spotlights.length < spotlightLimit && <button type="button" onClick={handleAddSpotlight} className="mt-4 text-sm text-customBlue-600 hover:text-customBlue-800 font-semibold">+ Add Spotlight</button>}
          </div>
          
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
             {isPremium ? (
                <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <BuzzIcon className="w-6 h-6 text-customBlue-600" />
                        <HoneycombIcon className="w-6 h-6 text-customBlue-600" />
                        <span>Book You're Searching For</span>
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Let others know what you're looking to buy. This will create a <strong>"Buzz Card"</strong> in the Title Hive, making your search visible to the entire community.
                    </p>
                </>
             ) : (
                <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Book You're Searching For (Optional)</h3>
                    <p className="text-sm text-gray-500 mb-4">Let others know what you're looking to buy. This will be displayed on your profile and will be searchable.</p>
                </>
             )}
             <div className="space-y-4">
                <div>
                    <label htmlFor="queryTitle" className="block text-sm font-medium text-gray-700">Book Title</label>
                    <input type="text" id="queryTitle" value={bookQuery.title || ''} onChange={e => handleBookQueryChange('title', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="queryAuthor" className="block text-sm font-medium text-gray-700">Author</label>
                    <input type="text" id="queryAuthor" value={bookQuery.author || ''} onChange={e => handleBookQueryChange('author', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="queryPublisher" className="block text-sm font-medium text-gray-700">Publisher</label>
                        <input type="text" id="queryPublisher" value={bookQuery.publisher || ''} onChange={e => handleBookQueryChange('publisher', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="queryEdition" className="block text-sm font-medium text-gray-700">Edition</label>
                        <input type="text" id="queryEdition" value={bookQuery.edition || ''} onChange={e => handleBookQueryChange('edition', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., 1st, Revised"/>
                    </div>
                    <div>
                        <label htmlFor="queryYear" className="block text-sm font-medium text-gray-700">Year Published</label>
                        <input type="number" id="queryYear" value={bookQuery.year || ''} onChange={e => handleBookQueryChange('year', e.target.value ? parseInt(e.target.value) : undefined)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isLoading || recordingIndex !== null} className="py-2 px-4 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-wait">
                {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileForm;