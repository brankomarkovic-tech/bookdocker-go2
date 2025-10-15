import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Book, Expert, BookStatus, UserStatus, UserRole } from '../types';
import { ChevronDownIcon } from './icons';

interface CarouselBook {
    book: Book;
    expert: Expert;
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
  
const LatestBooksCarousel: React.FC<{ books: CarouselBook[] }> = ({ books }) => {
    const { navigateToProfile } = useAppContext();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4);

    useEffect(() => {
        const calculateItems = () => {
            if (window.innerWidth >= 1280) return 10;
            if (window.innerWidth >= 1024) return 8;
            if (window.innerWidth >= 768) return 6;
            if (window.innerWidth >= 640) return 4;
            return 3;
        };
        
        const handleResize = () => {
            setItemsPerPage(calculateItems());
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = useMemo(() => {
        return books.length > itemsPerPage ? books.length - itemsPerPage : 0;
    }, [books.length, itemsPerPage]);

    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [currentIndex, maxIndex]);

    const next = () => {
        setCurrentIndex(current => Math.min(current + 1, maxIndex));
    };
    
    const prev = () => {
        setCurrentIndex(current => Math.max(current - 1, 0));
    };

    const itemWidthPercent = 100 / itemsPerPage;

    if (books.length === 0) {
        return (
            <div className="w-full aspect-[16/9] bg-gray-200 rounded-lg flex items-center justify-center p-4">
                <p className="text-gray-500 font-semibold">No books available yet.</p>
            </div>
        )
    }

    return (
        <div className="relative w-full" role="region" aria-label="Books Listings Carousel">
            <div className="overflow-hidden rounded-lg">
                <ul 
                    className="flex transition-transform duration-500 ease-in-out" 
                    style={{ transform: `translateX(-${currentIndex * itemWidthPercent}%)` }}
                >
                    {books.map(({ book, expert }) => (
                        <li 
                            key={`${expert.id}-${book.id}`}
                            className="flex-shrink-0"
                            style={{ width: `${itemWidthPercent}%` }}
                            aria-label={book.title}
                        >
                            <div className="p-1.5 h-full">
                                <div
                                    onClick={() => navigateToProfile(expert.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateToProfile(expert.id)}
                                    className="cursor-pointer group bg-white h-full flex flex-col overflow-hidden transition-shadow hover:shadow-xl rounded-md" 
                                    title={`View details for ${book.title}`}
                                >
                                    <div className="relative w-full pt-[125%] bg-gray-100">
                                        <img src={book.imageUrl || 'https://picsum.photos/seed/default-book/200/300'} alt={`Cover of ${book.title}`} className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="p-3 bg-white">
                                        <h4 className="font-bold text-sm truncate text-gray-800">{book.title}</h4>
                                        <p className="text-xs text-gray-600 truncate">{book.author}</p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            {books.length > itemsPerPage && (
                <>
                    <button 
                        onClick={prev} 
                        disabled={currentIndex === 0}
                        className="absolute top-1/2 -translate-y-1/2 -left-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:bg-white hover:text-black shadow-md transition-all disabled:opacity-0 disabled:cursor-not-allowed"
                        aria-label="Previous set of books"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>

                    <button 
                        onClick={next} 
                        disabled={currentIndex === maxIndex}
                        className="absolute top-1/2 -translate-y-1/2 -right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:bg-white hover:text-black shadow-md transition-all disabled:opacity-0 disabled:cursor-not-allowed"
                        aria-label="Next set of books"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    );
};

const IntroSection: React.FC = () => {
    const { experts } = useAppContext();
    const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
    
    const go2Listings = useMemo(() => {
        const flattenedBooks = experts
            .filter(e => e.role === UserRole.EXPERT && e.status === UserStatus.ACTIVE)
            .flatMap(expert => 
                (expert.books || [])
                    .filter(book => book.status === BookStatus.AVAILABLE)
                    .map(book => ({ book, expert }))
            );

        // Shuffle the books for a random, dynamic display
        const shuffledBooks = [...flattenedBooks].sort(() => Math.random() - 0.5);

        return shuffledBooks.slice(0, 20);
    }, [experts]);


    return (
        <div className="bg-customBlue-100 rounded-lg p-6 sm:p-8 my-12 max-w-6xl mx-auto">
            <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800">Books Listings</h3>
                <p className="text-gray-600 mt-2 text-base">
                    Explore a selection of listings from our GO2 experts.
                </p>
            </div>
            <div className="w-full">
                <LatestBooksCarousel books={go2Listings} />
            </div>
            <div className="mt-8 border-t border-customBlue-600/20 pt-6">
                <button
                    onClick={() => setIsAboutUsOpen(!isAboutUsOpen)}
                    className="w-full flex justify-between items-center text-left py-2 focus:outline-none focus-visible:ring focus-visible:ring-customBlue-600 focus-visible:ring-opacity-50 rounded-md"
                    aria-expanded={isAboutUsOpen}
                    aria-controls="about-us-content"
                >
                    <span className="text-xl font-bold text-gray-800">About Us</span>
                    <ChevronDownIcon
                        className={`w-6 h-6 text-gray-700 transform transition-transform duration-300 ${isAboutUsOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                <div
                    id="about-us-content"
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${isAboutUsOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                >
                    <p className="text-gray-700 leading-relaxed">
                        Our Community is a meeting point for bibliophiles and knowledgeable collectors. BookDocker GO2 is more than just a marketplace — it's a docking station for book lovers. Become a BookDocker GO2 and share your knowledge and expertise. As a contributor to the Community you will gain so much more than selling and buying on e-commerce platforms.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IntroSection;