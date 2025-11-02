import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BookStatus, Book, UserRole, BookQuery, SubscriptionTier, Spotlight } from '../types';
import { BackIcon, EmailIcon, BookIcon, XIcon, FacebookIcon, LinkedInIcon, SearchIcon, HeartIcon, MapPinIcon, InstagramIcon, YouTubeIcon, OnLeaveIcon, BuzzIcon, SparklesIcon, PresentIcon } from './icons';
import InquiryModal from './InquiryModal';
import EditProfileForm from './EditProfileForm';
import EditBooksForm from './EditBooksForm';
import Pagination from './Pagination';
import { invokeSendEmailFunction } from '../services/apiService';

type SortKey = 'title' | 'author' | 'year' | 'addedAt';
type SortDirection = 'asc' | 'desc';

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


const ExpertProfile: React.FC = () => {
  const { experts, selectedExpertId, navigateToList, isBookInWishlist, addToWishlist, removeFromWishlist, currentUser } = useAppContext();

  const selectedExpert = useMemo(() => {
    return experts.find(e => e.id === selectedExpertId);
  }, [experts, selectedExpertId]);

  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [links, setLinks] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'addedAt', direction: 'desc' });
  const [currentBookPage, setCurrentBookPage] = useState(1);
  const bookCollectionRef = useRef<HTMLDivElement>(null);
  const BOOKS_PER_PAGE = 10;

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedBookForInquiry, setSelectedBookForInquiry] = useState<Book | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditBooksOpen, setIsEditBooksOpen] = useState(false);

  // Cleanup effect to stop audio when the profile page unmounts
  useEffect(() => {
    return () => {
      document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.src = ''; // Detach source
      });
    };
  }, []);


  useEffect(() => {
    setCurrentBookPage(1);
  }, [bookSearchQuery, sortConfig]);

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

  const bookStats = useMemo(() => {
    if (!selectedExpert?.books) {
      return { available: 0, sold: 0, reserved: 0, total: 0 };
    }
    const available = selectedExpert.books.filter(b => b.status === BookStatus.AVAILABLE).length;
    const sold = selectedExpert.books.filter(b => b.status === BookStatus.SOLD).length;
    const reserved = selectedExpert.books.filter(b => b.status === BookStatus.RESERVED).length;
    return { available, sold, reserved, total: selectedExpert.books.length };
  }, [selectedExpert?.books]);

  if (!selectedExpert) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        <p className="text-gray-500">Expert not found.</p>
        <button
          onClick={navigateToList}
          className="mt-4 bg-customBlue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-customBlue-700 transition duration-300"
        >
          Back to List
        </button>
      </div>
    );
  }

  const { name, genre, bio, avatarUrl, email, books, spotlights, country, socialLinks, bookQuery, onLeave, subscriptionTier, presentOffer } = selectedExpert;
  const isOwner = currentUser?.id === selectedExpert.id;
  
  const presentBook = useMemo(() => {
    if (!presentOffer || !books) return null;
    return books.find(b => b.id === presentOffer.bookId);
  }, [presentOffer, books]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail || !message) {
        alert('Please fill out all required fields.');
        return;
    }
    setIsSending(true);
    try {
        await invokeSendEmailFunction({
            type: 'contact',
            senderEmail,
            message,
            links,
            expertName: name,
            expertEmail: email,
        });
        setFormSubmitted(true);
        setSenderEmail('');
        setMessage('');
        setLinks('');
        setTimeout(() => {
            setFormSubmitted(false);
            setIsContactFormOpen(false);
        }, 3000);
    } catch (error) {
        alert(error instanceof Error ? error.message : "An unexpected error occurred while sending the message.");
    } finally {
        setIsSending(false);
    }
  };

  const handleOpenInquiryModal = (book: Book) => {
    setSelectedBookForInquiry(book);
    setIsInquiryModalOpen(true);
  };

  const handleCloseInquiryModal = () => {
    setIsInquiryModalOpen(false);
    setSelectedBookForInquiry(null);
  };
  
  const getStatusBadge = (status: BookStatus | undefined) => {
    const baseClasses = "absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10";
    switch (status) {
        case BookStatus.SOLD:
            return <div className={`${baseClasses} bg-red-600`}>SOLD</div>;
        case BookStatus.RESERVED:
            return <div className={`${baseClasses} bg-yellow-500`}>RESERVED</div>;
        case BookStatus.AVAILABLE:
        default:
            return <div className={`${baseClasses} bg-green-500`}>AVAILABLE</div>;
    }
  }

  const shareUrl = window.location.href;
  const shareText = `Check out ${name}, a ${genre} GO2 expert on BookDocker GO2!`;
  const shareTitle = `${name} - ${genre} GO2 Expert`;

  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const linkedInShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(bio || '')}`;
  
  const filteredBooks = useMemo(() => (books || []).filter(book =>
      (book.title || '').toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      (book.author || '').toLowerCase().includes(bookSearchQuery.toLowerCase())
  ), [books, bookSearchQuery]);

  const sortedAndFilteredBooks = useMemo(() => {
    let sortableItems = [...filteredBooks];
    
    sortableItems.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'year') {
        valA = a.year;
        valB = b.year;
      } else if (sortConfig.key === 'addedAt') {
        valA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        valB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      } else {
        valA = (a[sortConfig.key] || '').toLowerCase();
        valB = (b[sortConfig.key] || '').toLowerCase();
      }

      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    if (presentBook) {
        const otherBooks = sortableItems.filter(b => b.id !== presentBook.id);
        return [presentBook, ...otherBooks];
    }
    
    return sortableItems;
  }, [filteredBooks, sortConfig, presentBook]);
  
  const totalBookPages = Math.ceil(sortedAndFilteredBooks.length / BOOKS_PER_PAGE);
  const currentBooks = sortedAndFilteredBooks.slice(
      (currentBookPage - 1) * BOOKS_PER_PAGE,
      currentBookPage * BOOKS_PER_PAGE
  );

  const handleBookPageChange = (page: number) => {
      if (page >= 1 && page <= totalBookPages) {
          setCurrentBookPage(page);
          bookCollectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const getSortButtonClass = (key: SortKey, direction: SortDirection) => {
    const isActive = sortConfig.key === key && sortConfig.direction === direction;
    const baseClass = "px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300";
    if (isActive) {
      return `${baseClass} bg-customBlue-600 text-white shadow-md`;
    }
    return `${baseClass} bg-white text-gray-700 hover:bg-gray-100 border`;
  };

  const BookQueryDisplay: React.FC<{ query: BookQuery }> = ({ query }) => (
    <div className="mt-12">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-customBlue-600">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                {subscriptionTier === SubscriptionTier.PREMIUM && <BuzzIcon className="w-8 h-8 text-customBlue-600" />}
                Searching For a Book to Buy
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="bg-[#d7fcea] px-3 py-1.5 rounded-md">
                    <span className="font-semibold text-green-900 mr-2">Title:</span>
                    <span className="text-gray-800">{query.title}</span>
                </div>
                <div className="bg-[#d7fcea] px-3 py-1.5 rounded-md">
                    <span className="font-semibold text-green-900 mr-2">Author:</span>
                    <span className="text-gray-800">{query.author}</span>
                </div>
                {query.publisher && (
                    <div className="bg-[#d7fcea] px-3 py-1.5 rounded-md">
                        <span className="font-semibold text-green-900 mr-2">Publisher:</span>
                        <span className="text-gray-800">{query.publisher}</span>
                    </div>
                )}
                {query.edition && (
                     <div className="bg-[#d7fcea] px-3 py-1.5 rounded-md">
                        <span className="font-semibold text-green-900 mr-2">Edition:</span>
                        <span className="text-gray-800">{query.edition}</span>
                    </div>
                )}
                {query.year && (
                     <div className="bg-[#d7fcea] px-3 py-1.5 rounded-md">
                        <span className="font-semibold text-green-900 mr-2">Year:</span>
                        <span className="text-gray-800">{query.year}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <button
            onClick={navigateToList}
            className="flex items-center text-customBlue-600 hover:text-customBlue-800 font-semibold"
          >
            <BackIcon className="w-5 h-5 mr-2" />
            Back to all experts
          </button>
        </div>

        {onLeave && (
            <div className="mb-8 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md flex items-center gap-3">
                <OnLeaveIcon className="w-6 h-6 flex-shrink-0" />
                <p className="font-semibold">This expert is currently on leave and may be slow to respond.</p>
            </div>
        )}

        {presentBook && presentOffer?.booksRequired && (
            <div className="mb-8 p-4 bg-rose-100 border-l-4 border-rose-500 text-rose-800 rounded-md flex items-center gap-3">
                <PresentIcon className="w-6 h-6 flex-shrink-0" />
                <p className="font-semibold">
                    Special Offer: Buy {presentOffer.booksRequired} or more books from my Book Collection listing within the same order, and you will receive the Gift Book marked by the Gift symbol.
                </p>
            </div>
        )}

        <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
          <div className="md:flex">
            <div className="md:w-64 md:flex-shrink-0 flex items-center justify-center p-6 bg-gray-50 border-b md:border-b-0 md:border-r">
                <img className="h-48 w-48 rounded-full object-cover shadow-lg ring-4 ring-white" src={avatarUrl} alt={`Avatar of ${name}`} />
            </div>
            <div className="p-8 flex-grow">
              <div className="flex items-center gap-2 uppercase tracking-wide text-sm text-customBlue-600 font-bold">
                  {subscriptionTier === SubscriptionTier.PREMIUM && <SparklesIcon className="w-5 h-5 text-yellow-500" />}
                  <span>{genre} GO2</span>
              </div>
              <h1 className="block mt-1 text-4xl leading-tight font-extrabold text-gray-900">{name}</h1>
              {country && (
                  <div className="flex items-center text-gray-500 text-sm mt-2">
                      <MapPinIcon className="w-4 h-4 mr-1.5" />
                      <span>{country}</span>
                  </div>
              )}
              <p className="mt-4 text-gray-600">{bio}</p>
              
              <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                      onClick={() => {
                          setIsContactFormOpen(!isContactFormOpen);
                          if (formSubmitted) setFormSubmitted(false);
                      }}
                      className="bg-customBlue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-customBlue-700 transition duration-300 flex items-center"
                  >
                      <EmailIcon className="w-5 h-5 mr-2" />
                      {isContactFormOpen ? 'Close Form' : 'Contact Expert'}
                  </button>
                  {isOwner && (
                    <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition duration-300"
                    >
                        Edit Profile
                    </button>
                  )}
                   <div className="flex items-center space-x-4">
                    {socialLinks?.x && (
                      <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" title="Visit X Profile" className="text-[#a8d9e6] hover:text-gray-900 transition-colors duration-300">
                          <XIcon className="w-6 h-6" />
                      </a>
                    )}
                    {socialLinks?.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" title="Visit Facebook Profile" className="text-[#a8d9e6] hover:text-blue-600 transition-colors duration-300">
                          <FacebookIcon className="w-6 h-6" />
                      </a>
                    )}
                    {socialLinks?.linkedIn && (
                      <a href={socialLinks.linkedIn} target="_blank" rel="noopener noreferrer" title="Visit LinkedIn Profile" className="text-[#a8d9e6] hover:text-blue-700 transition-colors duration-300">
                          <LinkedInIcon className="w-6 h-6" />
                      </a>
                    )}
                    {socialLinks?.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" title="Visit Instagram Profile" className="text-[#a8d9e6] hover:text-[#E1306C] transition-colors duration-300">
                          <InstagramIcon className="w-6 h-6" />
                      </a>
                    )}
                    {socialLinks?.youtube && (
                      <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" title="Visit YouTube Channel" className="text-[#a8d9e6] hover:text-red-600 transition-colors duration-300">
                          <YouTubeIcon className="w-6 h-6" />
                      </a>
                    )}
                  </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Share Profile</h4>
                  <div className="flex items-center space-x-4">
                      <a href={xShareUrl} target="_blank" rel="noopener noreferrer" title="Share on X" className="text-gray-400 hover:text-gray-800 transition-colors duration-300">
                          <XIcon className="w-6 h-6" />
                      </a>
                      <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" title="Share on Facebook" className="text-gray-400 hover:text-blue-600 transition-colors duration-300">
                          <FacebookIcon className="w-6 h-6" />
                      </a>
                      <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" title="Share on LinkedIn" className="text-gray-400 hover:text-blue-700 transition-colors duration-300">
                          <LinkedInIcon className="w-6 h-6" />
                      </a>
                  </div>
              </div>

              {isContactFormOpen && !formSubmitted && (
                  <div className="mt-4 p-6 border rounded-lg bg-gray-50 transition-all duration-500">
                      <form onSubmit={handleSendMessage} className="space-y-4">
                          <div>
                              <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700">Your Email Address</label>
                              <input 
                                  type="email" 
                                  id="senderEmail" 
                                  value={senderEmail} 
                                  onChange={(e) => setSenderEmail(e.target.value)} 
                                  required 
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                                  disabled={isSending}
                              />
                          </div>
                          <div>
                              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                              <textarea 
                                  id="message" 
                                  value={message} 
                                  onChange={(e) => setMessage(e.target.value)}
                                  rows={4} 
                                  required 
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                                  disabled={isSending}
                              ></textarea>
                          </div>
                          <div>
                              <label htmlFor="links" className="block text-sm font-medium text-gray-700">Add Links (optional)</label>
                              <input 
                                  type="text" 
                                  id="links" 
                                  value={links}
                                  onChange={(e) => setLinks(e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                                  disabled={isSending}
                              />
                          </div>
                          <div className="text-right">
                              <button type="submit" disabled={isSending} className="py-2 px-4 rounded-md border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-wait">
                                {isSending ? 'Sending...' : 'Send Message'}
                              </button>
                          </div>
                      </form>
                  </div>
              )}

              {formSubmitted && (
                  <div className="mt-4 p-4 text-center bg-green-100 text-green-800 rounded-lg transition-opacity duration-300">
                      Message sent successfully! The expert will contact you at your email address.
                  </div>
              )}
              
            </div>
          </div>
        </div>

        {spotlights && spotlights.length > 0 && (
          <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Expert's Spotlight</h2>
                <div className="relative pb-10">
                    <div className="overflow-hidden">
                        <div className="flex transition-transform duration-500 ease-in-out" style={{transform: `translateX(-${currentSpotlightIndex * 100}%)`}}>
                            {spotlights.map((spotlight) => {
                                const featuredBook = books.find(b => b.id === spotlight.featuredBookId);
                                return (
                                    <div key={spotlight.id} className="w-full flex-shrink-0 px-1">
                                        <div className="bg-white rounded-lg shadow-lg overflow-hidden group border border-customBlue-200">
                                            <div className="flex flex-col sm:flex-row sm:items-start">
                                                {featuredBook && (
                                                    <div className="sm:w-1/3 flex-shrink-0">
                                                        <div className="relative bg-gray-100 p-5 rounded-md">
                                                            {getStatusBadge(featuredBook.status)}
                                                            {/* Aspect ratio container for 2:3 */}
                                                            <div className="relative w-full pt-[150%] rounded-sm shadow-md overflow-hidden">
                                                                <img 
                                                                    src={featuredBook.imageUrl || 'https://picsum.photos/seed/default-book/200/300'} 
                                                                    alt={`Cover of ${featuredBook.title}`} 
                                                                    className={`absolute top-0 left-0 w-full h-full object-cover transition-all duration-300 ${featuredBook.status === BookStatus.SOLD ? 'grayscale' : ''}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`p-6 flex flex-col transition-opacity duration-300 ${featuredBook?.status === BookStatus.SOLD ? 'opacity-60' : ''}`}>
                                                    <h3 className="text-2xl font-bold text-gray-900">{spotlight.title}</h3>
                                                    {featuredBook && (
                                                        <>
                                                            <p className="text-md text-gray-600 mt-1">Featuring: {featuredBook.title} by {featuredBook.author}</p>
                                                            {featuredBook.price && (
                                                                <p className="text-2xl font-bold text-customBlue-700 mt-4">{formatPrice(featuredBook.price, featuredBook.currency)}</p>
                                                            )}
                                                        </>
                                                    )}
                                                     <div className="prose prose-sm max-w-none text-gray-700 mt-4">
                                                        {spotlight.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                                                    </div>
                                                    {spotlight.audioUrl && (
                                                        <div className="mt-4"><audio controls src={spotlight.audioUrl} className="w-full rounded-lg bg-[#d9d9d9]" /></div>
                                                    )}
                                                    
                                                    {featuredBook && featuredBook.status !== BookStatus.SOLD && (
                                                        <div className="mt-auto pt-4 flex items-center gap-4">
                                                            <button onClick={() => handleOpenInquiryModal(featuredBook)} className="bg-customBlue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-customBlue-700 transition duration-300 flex items-center"><EmailIcon className="w-5 h-5 mr-2" /> Inquire</button>
                                                            <button onClick={(e) => { e.stopPropagation(); isBookInWishlist(featuredBook.id) ? removeFromWishlist(featuredBook.id) : addToWishlist({ bookId: featuredBook.id, expertId: selectedExpert.id }); }} className="bg-gray-100 p-2.5 rounded-full text-red-500 hover:bg-red-100 transition-colors" aria-label="Add to wishlist"><HeartIcon className="w-6 h-6" isFilled={isBookInWishlist(featuredBook.id)} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                     {spotlights.length > 1 && (
                        <>
                            <button onClick={() => setCurrentSpotlightIndex(i => Math.max(0, i-1))} disabled={currentSpotlightIndex === 0} className="absolute top-1/2 -left-4 -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-md hover:bg-white disabled:opacity-0"><ChevronLeftIcon className="w-6 h-6"/></button>
                            <button onClick={() => setCurrentSpotlightIndex(i => Math.min(spotlights.length - 1, i+1))} disabled={currentSpotlightIndex === spotlights.length - 1} className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-md hover:bg-white disabled:opacity-0"><ChevronRightIcon className="w-6 h-6"/></button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                                {spotlights.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSpotlightIndex(index)}
                                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                                            currentSpotlightIndex === index ? 'bg-customBlue-600' : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        aria-label={`Go to spotlight ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
          </div>
        )}

        {bookQuery && <BookQueryDisplay query={bookQuery} />}
        
        <div ref={bookCollectionRef} className="mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <BookIcon className="w-6 h-6 mr-3 text-customBlue-600" />
                Book Collection
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  {(books?.length || 0) > 0 && (
                      <div className="relative w-full sm:w-auto">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search books by title or author..."
                            value={bookSearchQuery}
                            onChange={(e) => setBookSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-full shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-customBlue-600"
                            aria-label="Search expert's books"
                          />
                      </div>
                  )}
                  {isOwner && (
                    <button
                        onClick={() => setIsEditBooksOpen(true)}
                        className="bg-customBlue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-customBlue-700 transition duration-300 w-full sm:w-auto"
                    >
                        Add/Remove Books
                    </button>
                  )}
              </div>
          </div>
          
          {bookStats.total > 0 && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-800">{bookStats.total}</span>
                    <span className="text-sm text-gray-600">Total Books</span>
                </div>
                <div className="hidden sm:block flex-grow sm:border-l sm:border-gray-200 sm:h-6"></div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-sm font-semibold text-gray-700">{bookStats.available} Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-sm font-semibold text-gray-700">{bookStats.reserved} Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                    <span className="text-sm font-semibold text-gray-700">{bookStats.sold} Sold</span>
                </div>
            </div>
          )}

          {(books?.length || 0) > 0 && filteredBooks.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 mr-2">Sort by:</span>
               <button
                  onClick={() => setSortConfig({ key: 'addedAt', direction: 'desc' })}
                  className={getSortButtonClass('addedAt', 'desc')}
              >
                  Date Added (Newest)
              </button>
              <button
                  onClick={() => setSortConfig({ key: 'title', direction: 'asc' })}
                  className={getSortButtonClass('title', 'asc')}
              >
                  Title (A-Z)
              </button>
              <button
                  onClick={() => setSortConfig({ key: 'author', direction: 'asc' })}
                  className={getSortButtonClass('author', 'asc')}
              >
                  Author (A-Z)
              </button>
              <button
                  onClick={() => setSortConfig({ key: 'year', direction: 'desc' })}
                  className={getSortButtonClass('year', 'desc')}
              >
                  Year (Newest)
              </button>
              <button
                  onClick={() => setSortConfig({ key: 'year', direction: 'asc' })}
                  className={getSortButtonClass('year', 'asc')}
              >
                  Year (Oldest)
              </button>
            </div>
          )}
          
          {(books?.length || 0) > 0 ? (
              currentBooks.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {currentBooks.map(book => {
                      const isInWishlist = isBookInWishlist(book.id);
                      const isPresentBook = presentBook && book.id === presentBook.id;

                      return (
                          <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col relative group">
                            {isPresentBook && (
                                <div className="absolute top-0 left-0 w-16 h-16 z-20" title="Special Offer">
                                    <div className="absolute w-full h-full" style={{backgroundColor: '#d10a4d', clipPath: 'polygon(0 0, 100% 0, 0 100%)'}}></div>
                                    <PresentIcon className="absolute top-2 left-2 w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className="relative">
                                {getStatusBadge(book.status)}
                                {book.status !== BookStatus.SOLD && (
                                    <div className={`absolute top-2 left-2 z-20 flex flex-col gap-2 transition-opacity duration-200 ${isInWishlist ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isInWishlist) {
                                                    removeFromWishlist(book.id);
                                                } else {
                                                    addToWishlist({ bookId: book.id, expertId: selectedExpert.id });
                                                }
                                            }}
                                            className="bg-white/80 p-1.5 rounded-full text-red-500 hover:text-red-600 hover:bg-white"
                                            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                        >
                                            <HeartIcon className="w-5 h-5" isFilled={isInWishlist} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenInquiryModal(book);
                                            }}
                                            className="bg-white/80 p-1.5 rounded-full text-customBlue-600 hover:text-customBlue-800 hover:bg-white"
                                            aria-label={`Inquire about purchasing ${book.title}`}
                                            title="Inquire about this book"
                                        >
                                            <EmailIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                                <img 
                                  src={book.imageUrl || 'https://picsum.photos/seed/default-book/200/300'} 
                                  alt={`Cover of ${book.title}`} 
                                  className={`w-full h-56 object-cover transition-all duration-300 ${book.status === BookStatus.SOLD ? 'grayscale' : ''}`}
                                />
                            </div>
                            <div className={`p-4 flex flex-col flex-grow transition-opacity duration-300 ${book.status === BookStatus.SOLD ? 'opacity-60' : ''}`}>
                              <h4 className="font-bold text-md text-gray-800">{book.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                              <p className="text-xs text-gray-500 mt-1">{book.year}</p>
                              {book.condition && <p className="text-sm text-gray-500 mt-2 italic line-clamp-2">"{book.condition}"</p>}
                              <div className="mt-auto pt-2">
                                {book.price && book.status !== BookStatus.SOLD && (
                                  <p className="text-lg font-bold text-customBlue-700">
                                      {formatPrice(book.price, book.currency)}
                                  </p>
                                )}
                                {book.isbn && <p className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</p>}
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
                  <Pagination 
                    currentPage={currentBookPage}
                    totalPages={totalBookPages}
                    onPageChange={handleBookPageChange}
                  />
                </>
            ) : (
              <p className="text-center text-gray-500 py-8">No books found matching your search.</p>
            )
          ) : (
             isOwner ?
             <p className="text-center text-gray-500 py-8">You haven't listed any books yet. Click "Add/Remove Books" to get started.</p> :
             <p className="text-center text-gray-500 py-8">This expert has not listed any books yet.</p>
          )}
        </div>
      </div>

      {selectedBookForInquiry && (
        <InquiryModal
          isOpen={isInquiryModalOpen}
          onClose={handleCloseInquiryModal}
          expert={selectedExpert}
          book={selectedBookForInquiry}
        />
      )}

      {isOwner && isEditProfileOpen && (
        <EditProfileForm 
          expert={selectedExpert}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}

      {isOwner && isEditBooksOpen && (
        <EditBooksForm 
          expert={selectedExpert}
          onClose={() => setIsEditBooksOpen(false)}
        />
      )}
    </>
  );
};

export default ExpertProfile;