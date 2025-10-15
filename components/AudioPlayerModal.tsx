import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Expert, Spotlight } from '../types';
import { SearchIcon, PlayIcon, PauseIcon } from './icons';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);
  
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ isOpen, onClose }) => {
  const { experts, navigateToProfile } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const audioSpotlights = useMemo(() => {
    return experts.flatMap(expert => 
        (expert.spotlights || [])
            .filter(spotlight => spotlight.audioUrl && spotlight.title)
            .map(spotlight => ({ expert, spotlight }))
    );
  }, [experts]);


  const filteredAudios = useMemo(() => {
    if (!searchQuery) {
      return audioSpotlights;
    }
    const query = searchQuery.toLowerCase();
    
    const getFeaturedBook = (expert: Expert, spotlight: Spotlight) => {
      if (!spotlight.featuredBookId || !expert.books) return null;
      return expert.books.find(b => b.id === spotlight.featuredBookId);
    };

    return audioSpotlights.filter(({expert, spotlight}) => {
        const featuredBook = getFeaturedBook(expert, spotlight);
        return expert.name.toLowerCase().includes(query) || 
               spotlight.title!.toLowerCase().includes(query) ||
               (featuredBook && featuredBook.title.toLowerCase().includes(query)) ||
               (featuredBook && featuredBook.author.toLowerCase().includes(query));
      }
    );
  }, [searchQuery, audioSpotlights]);
  
   // Reset playback state when search query changes or modal opens/closes
  useEffect(() => {
    setCurrentlyPlayingIndex(null);
    setIsPlaying(false);
  }, [searchQuery, isOpen]);
  
  // Central playback control effect
  useEffect(() => {
    const audioEl = audioPlayerRef.current;
    if (!audioEl) return;

    if (currentlyPlayingIndex !== null) {
        const track = filteredAudios[currentlyPlayingIndex];
        if (track && track.spotlight.audioUrl) {
            // Only update src if it's different to avoid unnecessary reloads
            if (audioEl.src !== track.spotlight.audioUrl) {
                audioEl.src = track.spotlight.audioUrl;
            }
            audioEl.load();
            const playPromise = audioEl.play();
            if (playPromise) {
                playPromise.catch(e => console.error("Audio play failed in effect:", e));
            }
        }
    } else {
        audioEl.pause();
        // Don't clear src immediately, to allow pause to register
    }
  }, [currentlyPlayingIndex, filteredAudios]);


  // Cleanup effect to stop audio when the modal closes
  useEffect(() => {
    return () => {
      const audioEl = audioPlayerRef.current;
      if (audioEl) {
        audioEl.pause();
        audioEl.src = ''; // Detach source
      }
    };
  }, [isOpen]);

  const handleViewSpotlight = (expertId: string) => {
    navigateToProfile(expertId);
    onClose();
  };
  
  const playTrack = (index: number) => {
    if (index >= 0 && index < filteredAudios.length) {
        // If the same track is clicked, toggle play/pause
        if (currentlyPlayingIndex === index) {
            handleTogglePlayPause();
        } else {
            // Otherwise, set the new index; the useEffect will handle playback.
            setCurrentlyPlayingIndex(index);
        }
    }
  };
  
  const handleTogglePlayPause = () => {
    const audioEl = audioPlayerRef.current;
    if (!audioEl) return;

    if (isPlaying) {
        audioEl.pause();
    } else {
        if (currentlyPlayingIndex === null && filteredAudios.length > 0) {
            // If nothing is playing, start with the first track
            setCurrentlyPlayingIndex(0);
        } else {
            // Resume playback
            const playPromise = audioEl.play();
            if(playPromise) playPromise.catch(e => console.error("Audio resume failed:", e));
        }
    }
  };


  const handlePlayPrevious = () => {
    if (currentlyPlayingIndex !== null && currentlyPlayingIndex > 0) {
      setCurrentlyPlayingIndex(currentlyPlayingIndex - 1);
    }
  };

  const handlePlayNext = () => {
    if (currentlyPlayingIndex !== null && currentlyPlayingIndex < filteredAudios.length - 1) {
      setCurrentlyPlayingIndex(currentlyPlayingIndex + 1);
    } else if (currentlyPlayingIndex !== null) {
        // If it's the last track, stop playback
        setCurrentlyPlayingIndex(null);
    }
  };

  const handleOnPlay = () => setIsPlaying(true);
  const handleOnPause = () => setIsPlaying(false);
  const handleOnEnded = () => handlePlayNext();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-player-title"
    >
      <div
        className={`bg-white w-full max-w-4xl max-h-[70vh] rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 id="audio-player-title" className="text-xl font-bold text-gray-800">
            Expert Spotlight Audio
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" aria-label="Close audio player">
            &times;
          </button>
        </header>

        <div className="p-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by expert, post title, or book..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-full shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-customBlue-600"
              aria-label="Search audio posts"
            />
          </div>
        </div>
        
        {/* Navigation Controls */}
        <div className="px-6 pb-4 border-b">
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
             <div className="text-left flex-grow min-w-0 pr-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Now Playing</p>
                <p className="text-sm font-bold text-gray-800 truncate" title={currentlyPlayingIndex !== null ? filteredAudios[currentlyPlayingIndex].spotlight.title! : 'Select a track to play'}>
                  {currentlyPlayingIndex !== null ? filteredAudios[currentlyPlayingIndex].spotlight.title : 'Select a track to play'}
                </p>
              </div>

             <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handlePlayPrevious}
                  disabled={currentlyPlayingIndex === null || currentlyPlayingIndex === 0}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous track"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <button
                    onClick={handleTogglePlayPause}
                    disabled={filteredAudios.length === 0}
                    className="p-2 rounded-full text-white bg-customBlue-600 hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                </button>

                <button
                  onClick={handlePlayNext}
                  disabled={currentlyPlayingIndex === null || currentlyPlayingIndex >= filteredAudios.length - 1}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next track"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {filteredAudios.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery ? 'No matching audio posts found.' : 'No audio posts available yet.'}
              </p>
              <p className="text-gray-400 mt-2">
                {searchQuery ? 'Try a different search term.' : 'Experts can add narrated posts from their profile.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredAudios.map(({expert, spotlight}, index) => (
                <li key={spotlight.id} className={`p-4 bg-gray-50 rounded-lg border transition-all ${index === currentlyPlayingIndex ? 'border-customBlue-600 ring-2 ring-customBlue-400/50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-grow">
                        <h3 className="font-bold text-gray-900 text-lg">{spotlight.title}</h3>
                        <p className="text-sm text-gray-600">by {expert.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => playTrack(index)}
                            className="p-2 rounded-full text-white bg-customBlue-600 hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                            aria-label={isPlaying && currentlyPlayingIndex === index ? `Pause ${spotlight.title}` : `Play ${spotlight.title}`}
                        >
                            {isPlaying && currentlyPlayingIndex === index ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                        </button>
                        <button
                            onClick={() => handleViewSpotlight(expert.id)}
                            className="py-1 px-3 rounded-full bg-customBlue-100 text-customBlue-800 text-xs font-bold hover:bg-customBlue-200 transition-colors"
                        >
                            View Post
                        </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Single, hidden audio player */}
        <audio
          ref={audioPlayerRef}
          onPlay={handleOnPlay}
          onPause={handleOnPause}
          onEnded={handleOnEnded}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default AudioPlayerModal;