import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import ExpertCard from './ExpertCard';
import { SearchIcon, ChevronDownIcon, HeartIcon, RightArrowIcon } from './icons';
import { BookGenre, Expert, Book, BookStatus, UserRole } from '../types';
import IntroSection from './IntroSection';
import Pagination from './Pagination';
import { invokeSendEmailFunction } from '../services/apiService';

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

const BookResultItem: React.FC<{ book: Book; expertId: string }> = ({ book, expertId }) => {
    const { isBookInWishlist, addToWishlist, removeFromWishlist } = useAppContext();
    const isInWishlist = isBookInWishlist(book.id);

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isInWishlist) {
            removeFromWishlist(book.id);
        } else {
            addToWishlist({ bookId: book.id, expertId });
        }
    };

    return (
        <div className="flex items-start p-3 bg-white rounded-lg space-x-4 border border-gray-200 hover:border-customBlue-400 transition-colors relative group">
            <img
                src={book.imageUrl || 'https://picsum.photos/seed/default-book/200/300'}
                alt={`Cover of ${book.title}`}
                className="w-16 h-24 object-cover rounded-md shadow-sm flex-shrink-0"
            />
            <div className="flex-grow">
                <h5 className="font-bold text-gray-800">{book.title}</h5>
                <p className="text-sm text-gray-600">{book.author}</p>
                <p className="text-xs text-gray-500 mt-1">{book.year}</p>
                {book.price && book.status !== BookStatus.SOLD && (
                     <p className="text-md font-bold text-customBlue-700 mt-1">
                        {formatPrice(book.price, book.currency)}
                    </p>
                )}
            </div>
             {book.status !== BookStatus.SOLD && (
                <button
                    onClick={handleWishlistClick}
                    className={`absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500 hover:text-red-600 hover:bg-white transition-all duration-200 ${isInWishlist ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <HeartIcon className="w-5 h-5" isFilled={isInWishlist} />
                </button>
            )}
        </div>
    );
};

const SearchResultGroup: React.FC<{ expert: Expert }> = ({ expert }) => {
    const { searchQuery, navigateToProfile } = useAppContext();
    const query = searchQuery.toLowerCase();

    const matchingBooks = (expert.books || []).filter(book =>
        (book.title || '').toLowerCase().includes(query) ||
        (book.author || '').toLowerCase().includes(query)
    );

    const queryMatchesBookQuery = expert.bookQuery ?
        (expert.bookQuery.title.toLowerCase().includes(query) ||
         expert.bookQuery.author.toLowerCase().includes(query))
        : false;

    return (
        <section
            aria-labelledby={`expert-heading-${expert.id}`}
            className="bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl"
        >
            <div
                onClick={() => navigateToProfile(expert.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateToProfile(expert.id)}
                className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:bg-customBlue-100/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-customBlue-600 focus:ring-offset-2"
                aria-label={`View profile for ${expert.name}`}
            >
                <img className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-customBlue-100" src={expert.avatarUrl} alt="" />
                <div className="text-center md:text-left flex-grow">
                    <h3 id={`expert-heading-${expert.id}`} className="text-xl font-bold text-gray-900">{expert.name}</h3>
                    <div className="mt-1">
                        <span className="inline-block bg-customBlue-100 text-customBlue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                            {expert.genre} GO2
                        </span>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">{expert.bio}</p>
                </div>
            </div>
            
            {queryMatchesBookQuery && expert.bookQuery && (
                 <div className="p-6 border-t border-gray-200 bg-customBlue-50">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider" aria-label={`Expert is searching for a book matching your query`}>
                        Is Searching For
                    </h4>
                    <div className="flex items-start p-3 bg-white rounded-lg space-x-4 border border-customBlue-400">
                        <div className="flex-shrink-0 flex items-center justify-center w-16 h-24 bg-gray-100 rounded-md shadow-sm">
                            <SearchIcon className="w-8 h-8 text-gray-400" />
                        </div>
                         <div className="flex-grow">
                            <h5 className="font-bold text-gray-800">{expert.bookQuery.title}</h5>
                            <p className="text-sm text-gray-600">{expert.bookQuery.author}</p>
                            {expert.bookQuery.year && <p className="text-xs text-gray-500 mt-1">{expert.bookQuery.year}</p>}
                        </div>
                    </div>
                </div>
            )}

            {matchingBooks.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider" aria-label={`Matching books from ${expert.name}`}>
                        Matching Books from this Expert
                    </h4>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                        {matchingBooks.map(book => (
                            <BookResultItem key={book.id} book={book} expertId={expert.id} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

const InviteFriendSection: React.FC = () => {
  const { currentUser } = useAppContext();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter an email address.');
      return;
    }
    
    setIsSending(true);
    try {
        await invokeSendEmailFunction({
            type: 'invite',
            friendEmail: email,
            message,
            inviterName: currentUser ? currentUser.name : 'A fellow book lover'
        });

        setIsSent(true);
        setEmail('');
        setMessage('');

        setTimeout(() => {
          setIsSent(false);
        }, 5000);
    } catch (error) {
        alert(error instanceof Error ? error.message : "An unexpected error occurred while sending the invitation.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#c2e9f2' }} className="py-16">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Invite a Book Lover</h2>
        <p className="text-gray-700 mb-8">
          Know a fellow book enthusiast or a potential GO2 expert? Share the BookDocker GO2 community with them!
        </p>

        {isSent ? (
           <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center font-semibold">
                    Invitation sent successfully! Thank you for helping our community grow.
                </div>
           </div>
        ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md text-left space-y-6">
                <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                        Friend's Email Address
                    </label>
                    <input
                        type="email"
                        id="invite-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                        placeholder="friend@example.com"
                        aria-required="true"
                        disabled={isSending}
                    />
                </div>
                <div>
                    <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700">
                        Add a Short Message (Optional)
                    </label>
                    <textarea
                        id="invite-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-customBlue-600 focus:ring-customBlue-600"
                        placeholder="Check out this cool community for book lovers!"
                        disabled={isSending}
                    ></textarea>
                </div>
                <div className="text-center pt-2">
                    <button
                        type="submit"
                        className="bg-customBlue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-customBlue-700 transition duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-wait"
                        disabled={isSending}
                    >
                        {isSending ? 'Sending...' : 'Send Invite'}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};
const faqData: { question: string; answer: string | React.ReactNode }[] = [
  {
    question: 'How do you define a GO2 expert for books and printed editions?',
    answer: 'A GO2 expert for books and printed editions is defined as an individual who possesses a considerable personal library, especially if it is focused on a particular genre. Owning a large collection within a specific literary category qualifies one as a valuable resource for the BookDocker GO2 platform. Such a book enthusiast typically organizes their collection by genre, rather than simply accumulating random piles of printed editions. This speciality often results in the majority of their library comprising titles from their preferred genre. However, being a GO2 expert does not restrict one to listing only books from their area of expertise for sale on the platform. Instead, it means that when someone seeks advice or guidance on a specific genre or is searching for a particular book, they benefit significantly by reaching out to you. Even if you do not currently possess the exact book they are looking for, your expertise situates you as a knowledgeable contact who can assist them effectively in their search for printed editions within that genre.',
  },
  {
    question: 'How do I join as a GO2 Expert?',
    answer: 'Simply click the "Be GO2" button in the header and fill out your profile form. You can list your books, generate an AI-powered bio, and share your passion with the community right away.',
  },
  {
    question: 'Is it free to join?',
    answer: 'Yes, creating a GO2 Expert profile and listing your books is completely free during our BETA phase. We believe in building a community first. After the BETA period concludes, the users may receive a complimentary 30-day trial of the service, after which they will be able to select a subscription plan, which involves monthly fees that are billed on an annual basis.',
  },
  {
    question: 'Is there a limit to how many books I can list?',
    answer: 'Yes, during our BETA phase you can list up to 35 books that are available for buying. Once you sell one, you can add one too, as long you fit the limit of 35 books or printed editions. We encourage showcasing curated, quality collections.',
  },
  {
    question: 'What are some useful hints before purchasing a book?',
    answer: 'We recommend carefully reading the condition description provided by the expert. Use the "Contact Expert" button to ask for more details, photos, or to arrange payment and shipping. Direct communication is key to a successful purchase.',
  },
  {
    question: 'What are the Terms of Use?',
    answer: 'BookDocker GO2 acts as a meeting point for book lovers. All transactions are handled directly between the expert and the buyer. BookDocker GO2 is not a party to any transaction and is not responsible for payments, shipping, or the condition of items. We trust our community to engage in fair and respectful communication. By creating the BookDocker GO2 accounts you confirm that you understand and accept the BookDocker GO2 Terms of Use.',
  },
  {
    question: 'BookDocker GO2: Community Guidelines',
    answer: (
      <div className="space-y-3">
        <p>
          Welcome to BookDocker GO2! We are a community built on a shared passion for books and mutual respect. To ensure a safe, inclusive, and positive environment for everyone, we require all members to adhere to the following simple rule:
        </p>
        <p className="font-bold text-center text-lg py-2 bg-customBlue-100 text-customBlue-800 rounded-md">
          Be Respectful. Be Kind.
        </p>
        <p>
          We have a zero-tolerance policy for any form of hate speech, harassment, or discriminatory content. This includes any offensive speech or writing based on:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-1">
          <li>Race, color, or ethnic origin</li>
          <li>Religion or personal beliefs</li>
          <li>Political affiliation</li>
          <li>Sexual orientation, gender identity, or expression</li>
          <li>Minority status, nationality, or disability</li>
        </ul>
        <p>
          Any content that is abusive, threatening, or promotes hostility towards any individual or group will be removed immediately. Violations of this policy may result in a warning, account suspension, or a permanent ban from the platform.
        </p>
        <p>
          Thank you for helping us keep BookDocker GO2 a welcoming space for all book lovers.
        </p>
      </div>
    ),
  },
  {
    question: 'What will Premium subscription bring? (A Sneak Peak)',
    answer: 'Being a dedicated expert collector, you may find that you want to manage your collection on your own, directly, without a mediator or dealer. This is where the BookDocker GO2 Premium Toolkit steps in, allowing you to foster and grow your collection or use it as an earning tool. Be creative!',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto divide-y divide-gray-200">
          {faqData.map((item, index) => (
            <div key={index} className="py-2">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left py-2 focus:outline-none focus-visible:ring focus-visible:ring-customBlue-600 focus-visible:ring-opacity-50 rounded-md"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-lg font-semibold text-gray-800">{item.question}</span>
                <ChevronDownIcon
                  className={`w-6 h-6 flex-shrink-0 text-gray-500 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`transition-all duration-300 ease-in-out ${
                    openIndex === index
                    ? 'max-h-[30rem] opacity-100 overflow-y-auto'
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="pt-1 pb-3 pr-8">
                  <div className="text-gray-600 leading-relaxed">{item.answer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExpertList: React.FC = () => {
  const { filteredExperts, searchQuery, setSearchQuery, genreFilter, setGenreFilter, currentUser, navigateToProfile } = useAppContext();
  const [isGenreListExpanded, setIsGenreListExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 8; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, genreFilter]);

  const totalPages = Math.ceil(filteredExperts.length / CARDS_PER_PAGE);
  const currentExperts = filteredExperts.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getGenreButtonClass = (genre: BookGenre | null) => {
    const baseClass = "px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300";
    if (genreFilter === genre) {
      return `${baseClass} bg-customBlue-600 text-white shadow-md`;
    }
    return `${baseClass} bg-white text-gray-700 hover:bg-gray-100 border`;
  };

  const handleGenreSelect = (genre: BookGenre | null) => {
    setGenreFilter(genre);
    setIsGenreListExpanded(false);
  };

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        
        {currentUser && currentUser.role === UserRole.EXPERT && (
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => navigateToProfile(currentUser.id)}
              className="flex items-center text-customBlue-600 hover:text-customBlue-800 font-semibold"
            >
              Go to your profile
              <RightArrowIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        <h2 className="text-4xl font-bold text-center text-[#063542] mb-2">BookDocker GO2 Experts</h2>
        <p className="text-center text-gray-500 mb-8 text-lg">Your curated source for used books.</p>
        
        <div className="mb-8 max-w-lg mx-auto">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search experts by name, genre, or book title/author"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-full shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-customBlue-600"
              aria-label="Search experts by name, genre, or book title/author"
            />
          </div>
        </div>
        
        {searchQuery ? (
            <>
                {filteredExperts.length === 0 ? (
                    <p className="text-center text-gray-500 py-16">
                        No experts or books found for your criteria.
                    </p>
                ) : (
                    <>
                        <div className="space-y-8 max-w-4xl mx-auto">
                            {currentExperts.map(expert => (
                                <SearchResultGroup key={expert.id} expert={expert} />
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </>
        ) : (
            <>
                <IntroSection />

                <div className="mt-12 mb-8 max-w-4xl mx-auto">
                    <button
                        onClick={() => setIsGenreListExpanded(!isGenreListExpanded)}
                        className="w-full flex justify-between items-center text-left bg-white px-6 py-4 rounded-lg shadow-sm border text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                        aria-expanded={isGenreListExpanded}
                        aria-controls="genre-list"
                    >
                        <span className="font-semibold text-lg">Filter by Genre</span>
                        <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-300 ${isGenreListExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div
                        id="genre-list"
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${isGenreListExpanded ? 'max-h-[2400px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="p-6 bg-white rounded-lg shadow-sm border border-t-0">
                            <div className="flex justify-center flex-wrap gap-2">
                                <button
                                onClick={() => handleGenreSelect(null)}
                                className={getGenreButtonClass(null)}
                                aria-pressed={genreFilter === null}
                                >
                                All
                                </button>
                                {Object.values(BookGenre).map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => handleGenreSelect(genre)}
                                    className={getGenreButtonClass(genre)}
                                    aria-pressed={genreFilter === genre}
                                >
                                    {genre}
                                </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {filteredExperts.length === 0 ? (
                     <p className="text-center text-gray-500 py-16">
                        {genreFilter ? `No experts found for your criteria.` : 'No experts have registered yet. Be the first!'}
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {currentExperts.map(expert => (
                                <ExpertCard key={expert.id} expert={expert} />
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </>
        )}
      </div>
      <InviteFriendSection />
      <FAQ />
    </>
  );
};

export default ExpertList;