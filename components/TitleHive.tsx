import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Expert, SubscriptionTier } from '../types';
import { BackIcon, HoneycombIcon, SearchIcon, BuzzIcon } from './icons';
import Pagination from './Pagination';

interface BuzzCardProps {
    expert: Expert;
}

const BuzzCard: React.FC<BuzzCardProps> = ({ expert }) => {
    const { navigateToProfile } = useAppContext();
  
    if (!expert.bookQuery) return null;

    return (
      <div
        onClick={() => navigateToProfile(expert.id)}
        className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer flex flex-col p-4 h-full items-center text-center relative"
        aria-label={`View profile for ${expert.name} who is searching for ${expert.bookQuery.title}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateToProfile(expert.id)}
      >
        <div className="absolute top-0 left-0 w-14 h-14 z-10" title="This is a live buzz!">
            <div className="absolute w-full h-full bg-customBlue-600" style={{clipPath: 'polygon(0 0, 100% 0, 0 100%)'}}></div>
            <BuzzIcon className="absolute top-1 left-1 w-6 h-6 text-white" />
        </div>
        
        <div className="w-full h-full flex flex-col items-center">
            <img className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-customBlue-100 mb-3" src={expert.avatarUrl} alt={expert.name} />
            
            <div className="mb-3">
                <h3 className="text-md font-bold text-gray-800 leading-tight truncate" title={expert.name}>{expert.name}</h3>
                <span className="inline-block bg-customBlue-100 text-customBlue-800 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                    {expert.genre} GO2
                </span>
            </div>
            
            <div className="mt-auto p-3 bg-green-50 rounded-md border border-green-200 w-full text-left">
                <p className="text-xs font-semibold text-green-800">Searching For:</p>
                <p className="text-sm font-bold text-gray-700 truncate" title={expert.bookQuery.title}>{expert.bookQuery.title}</p>
                <p className="text-xs text-gray-600 truncate" title={expert.bookQuery.author}>by {expert.bookQuery.author}</p>
            </div>
        </div>
      </div>
    );
};


const TitleHive: React.FC = () => {
    const { experts, navigateToList } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const BUZZ_CARDS_PER_PAGE = 24;

    const premiumExpertsWithQueries = useMemo(() => experts.filter(
        expert => expert.subscriptionTier === SubscriptionTier.PREMIUM && expert.bookQuery?.title && expert.bookQuery?.author
    ), [experts]);

    const filteredExperts = useMemo(() => {
        if (!searchQuery) {
            return premiumExpertsWithQueries;
        }
        const query = searchQuery.toLowerCase();
        return premiumExpertsWithQueries.filter(expert =>
            expert.bookQuery?.title.toLowerCase().includes(query) ||
            expert.bookQuery?.author.toLowerCase().includes(query)
        );
    }, [premiumExpertsWithQueries, searchQuery]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredExperts.length / BUZZ_CARDS_PER_PAGE);
    const currentExperts = filteredExperts.slice(
        (currentPage - 1) * BUZZ_CARDS_PER_PAGE,
        currentPage * BUZZ_CARDS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
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
            
            <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-4 mb-2">
                    <HoneycombIcon className="w-12 h-12 text-customBlue-600" />
                    <h1 className="text-4xl font-extrabold text-gray-800">The Title Hive</h1>
                </div>
                <p className="mt-2 text-lg text-gray-600 max-w-6xl mx-auto">
                    A live marketplace of demand from our Premium experts. When a Premium expert announces their <strong>Search For</strong> a book, it creates a "<strong>Buzz</strong>" here for everyone to see. Moreover, a Premium user will receive an instant <strong>Alert Message</strong> the moment the <strong>Searched For</strong> book is listed on BookDocker GO2.
                </p>
            </div>
            
             <div className="mb-8 max-w-lg mx-auto">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                    type="text"
                    placeholder="Search by book title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-full shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-customBlue-600"
                    aria-label="Search the Title Hive"
                    />
                </div>
            </div>

            {premiumExpertsWithQueries.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md border">
                    <p className="text-gray-500 text-xl">The hive is quiet for now.</p>
                    <p className="text-gray-400 mt-2">No premium experts are currently searching for books.</p>
                </div>
            ) : filteredExperts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-md border">
                    <p className="text-gray-500 text-xl">No buzzes found.</p>
                    <p className="text-gray-400 mt-2">Try adjusting your search query.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {currentExperts.map(expert => (
                            <BuzzCard key={expert.id} expert={expert} />
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
};

export default TitleHive;