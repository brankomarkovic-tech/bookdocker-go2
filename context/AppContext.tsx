import React, { createContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Expert, BookGenre, WishlistItem, UserRole, UserStatus, Book, SubscriptionTier, BookStatus } from '../types';
import { getExperts, createExpert, updateExpert, deleteMultipleExperts as apiDeleteMultipleExperts, DuplicateEmailError } from '../services/apiService';
import { EXAMPLE_EXPERTS } from '../exampleData';
import { ADMIN_CREDENTIALS, ADMIN_USER_OBJECT } from '../constants';

// Define the shape of the context
interface AppContextType {
    experts: Expert[];
    filteredExperts: Expert[];
    currentUser: Expert | null;
    view: 'list' | 'profile' | 'admin' | 'title-hive';
    selectedExpertId: string | null;
    wishlist: WishlistItem[];
    isBookInWishlist: (bookId: string) => boolean;
    addToWishlist: (item: WishlistItem) => void;
    removeFromWishlist: (bookId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    genreFilter: BookGenre | null;
    setGenreFilter: (genre: BookGenre | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    login: (email: string) => Promise<Expert | null>;
    logout: () => void;
    addExpert: (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'isExample' | 'role' | 'status' | 'subscriptionTier' | 'books' | 'spotlights' | 'onLeave'>) => Promise<boolean>;
    updateExpertProfile: (expertId: string, profileData: Partial<Expert>) => Promise<boolean>;
    updateExpertBooks: (expertId: string, books: Book[]) => Promise<void>;
    updateExpertStatus: (expertId: string, status: UserStatus) => Promise<void>;
    deleteMultipleExperts: (expertIds: string[]) => Promise<void>;
    updatingExpertIds: Set<string>;
    isErasing: boolean;
    navigateToList: () => void;
    navigateToProfile: (expertId: string) => void;
    navigateToAdmin: () => void;
    navigateToTitleHive: () => void;
}

// Create the context with a default undefined value
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Define the provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // STATE MANAGEMENT
    const [experts, setExperts] = useState<Expert[]>([]);
    const [currentUser, setCurrentUser] = useState<Expert | null>(null);
    const [view, setView] = useState<'list' | 'profile' | 'admin' | 'title-hive'>('list');
    const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [genreFilter, setGenreFilter] = useState<BookGenre | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingExpertIds, setUpdatingExpertIds] = useState<Set<string>>(new Set());
    const [isErasing, setIsErasing] = useState(false);

    // DATA FETCHING & INITIALIZATION
    useEffect(() => {
        const fetchAndSetExperts = async () => {
            setIsLoading(true);
            try {
                const dbExperts = await getExperts();
                const combinedExperts = [...EXAMPLE_EXPERTS, ...dbExperts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setExperts(combinedExperts);
            } catch (error) {
                console.error("Failed to fetch experts:", error);
                setExperts(EXAMPLE_EXPERTS); // Fallback to example data
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndSetExperts();

        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
            setWishlist(JSON.parse(storedWishlist));
        }

        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
        }
    }, []);

    // NAVIGATION
    const navigateToList = useCallback(() => {
        setView('list');
        setSelectedExpertId(null);
        setSearchQuery('');
    }, []);

    const navigateToProfile = useCallback((expertId: string) => {
        setView('profile');
        setSelectedExpertId(expertId);
    }, []);
    
    // Deep Linking Effect
    useEffect(() => {
        if (experts.length > 0) {
            const hash = window.location.hash;
            const profileMatch = hash.match(/^#\/profile\/(.+)$/);
            if (profileMatch && profileMatch[1]) {
                const expertId = profileMatch[1];
                if (experts.some(e => e.id === expertId)) {
                    navigateToProfile(expertId);
                }
            }
        }
    }, [experts, navigateToProfile]);


    const navigateToAdmin = useCallback(() => {
        if (currentUser?.role === UserRole.ADMIN) {
            setView('admin');
        }
    }, [currentUser]);

    const navigateToTitleHive = useCallback(() => {
        setView('title-hive');
    }, []);

    // USER & AUTHENTICATION
    const login = useCallback(async (email: string): Promise<Expert | null> => {
        setIsLoading(true);
        try {
            const lowerCaseEmail = email.toLowerCase();

            // Special check for the hardcoded administrator
            if (lowerCaseEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
                const adminUser = ADMIN_USER_OBJECT;
                setCurrentUser(adminUser);
                sessionStorage.setItem('currentUser', JSON.stringify(adminUser));
                setView('admin');
                return adminUser;
            }

            // Proceed with normal user login
            const user = experts.find(e => e.email.toLowerCase() === lowerCaseEmail);
            if (user) {
                setCurrentUser(user);
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                if (user.role === UserRole.ADMIN) { // Should not happen now, but good to keep
                    setView('admin');
                } else {
                    setView('list');
                }
                return user;
            }
            return null;
        } catch (error) {
            console.error("Login failed:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [experts]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        setView('list');
    }, []);

    // EXPERT DATA MANAGEMENT
    const addExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'isExample' | 'role' | 'status' | 'subscriptionTier' | 'books' | 'spotlights' | 'onLeave'>): Promise<boolean> => {
        setIsLoading(true);
        try {
            const newExpertPayload: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'isExample'> = {
                ...expertData,
                role: UserRole.EXPERT,
                status: UserStatus.ACTIVE,
                subscriptionTier: SubscriptionTier.FREE,
                books: [],
                spotlights: [],
                onLeave: false,
            };
            const createdExpert = await createExpert(newExpertPayload);
            const updatedExperts = [createdExpert, ...experts];
            setExperts(updatedExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            await login(createdExpert.email);
            return true;
        } catch (error) {
            console.error("Error adding expert:", error);
            if (error instanceof DuplicateEmailError) {
                alert("An expert with this email already exists. Please use a different email.");
            } else {
                alert("An error occurred while creating the profile. Please try again.");
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    
    const updateExpertProfile = async (expertId: string, profileData: Partial<Expert>): Promise<boolean> => {
        const expertToUpdate = experts.find(e => e.id === expertId);
        if (!expertToUpdate) {
            console.error("Cannot update profile, expert not found in state:", expertId);
            alert("An error occurred while updating the profile.");
            return false;
        }
    
        // If the user is an example user, update the state locally and do not call the API.
        if (expertToUpdate.isExample) {
            const updatedExampleExpert = { ...expertToUpdate, ...profileData, updatedAt: new Date().toISOString() };
            setExperts(prevExperts => {
                const newExperts = prevExperts.map(e => e.id === expertId ? updatedExampleExpert : e);
                return newExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
            if (currentUser?.id === expertId) {
                const updatedCurrentUser = { ...currentUser, ...profileData };
                setCurrentUser(updatedCurrentUser);
                sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            }
            return true;
        }
        
        // For real users, proceed with the API call as before.
        setUpdatingExpertIds(prev => new Set(prev).add(expertId));
        try {
            const updatedExpert = await updateExpert(expertId, profileData);
            setExperts(prevExperts => {
                const newExperts = prevExperts.map(e => e.id === expertId ? { ...e, ...updatedExpert } : e);
                return newExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
            if (currentUser?.id === expertId) {
                const updatedCurrentUser = { ...currentUser, ...updatedExpert };
                setCurrentUser(updatedCurrentUser);
                sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            }
            return true;
        } catch (error) {
            console.error("Failed to update expert profile:", error);
            alert(`Failed to update profile: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
            return false;
        } finally {
            setUpdatingExpertIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(expertId);
                return newSet;
            });
        }
    };
    
    const runAlertAgent = (updatedExpert: Expert, newBooks: Book[]) => {
        if (newBooks.length === 0) return;

        const premiumSearchers = experts.filter(
            e => e.subscriptionTier === SubscriptionTier.PREMIUM &&
                    e.bookQuery?.title &&
                    e.bookQuery?.author &&
                    e.id !== updatedExpert.id // Don't notify the seller
        );

        if (premiumSearchers.length === 0) return;

        for (const newBook of newBooks) {
            for (const searcher of premiumSearchers) {
                const queryTitle = searcher.bookQuery!.title.toLowerCase();
                const queryAuthor = searcher.bookQuery!.author.toLowerCase();
                const bookTitle = newBook.title.toLowerCase();
                const bookAuthor = newBook.author.toLowerCase();

                if (bookTitle.includes(queryTitle) && bookAuthor.includes(queryAuthor)) {
                    const profileUrl = `${window.location.origin}${window.location.pathname}#/profile/${updatedExpert.id}`;
                    console.log(`--- 📧 TITLE HIVE ALERT ---`);
                    console.log(`To: ${searcher.email}`);
                    console.log(`Subject: A Book You're Searching For Is Now Available!`);
                    console.log(`\nHello ${searcher.name},\n`);
                    console.log(`Good news! A book matching your search query has just been listed by ${updatedExpert.name}.`);
                    console.log(`\n--- Book Details ---`);
                    console.log(`Title: ${newBook.title}`);
                    console.log(`Author: ${newBook.author}`);
                    console.log(`\nYou can view the expert's profile here: ${profileUrl}`);
                    console.log(`-------------------------\n`);
                }
            }
        }
    };

    const updateExpertBooks = async (expertId: string, books: Book[]) => {
        const expertToUpdate = experts.find(e => e.id === expertId);
        if (!expertToUpdate) return;

        const oldBookIds = new Set((expertToUpdate.books || []).map(b => b.id));
        const newBooks = books.filter(b => !oldBookIds.has(b.id) && b.status === BookStatus.AVAILABLE);

        // If the user is an example user, handle the update locally.
        if (expertToUpdate.isExample) {
            const profileData = { books };
            const updatedExampleExpert = { ...expertToUpdate, ...profileData, updatedAt: new Date().toISOString() };
            setExperts(prevExperts => prevExperts.map(e => e.id === expertId ? updatedExampleExpert : e));
            
            if (currentUser?.id === expertId) {
                const updatedCurrentUser = { ...currentUser, ...profileData };
                setCurrentUser(updatedCurrentUser);
                sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            }
            // Run the alert agent on the locally updated data.
            runAlertAgent(updatedExampleExpert, newBooks);
            return;
        }

        // For real users, call the API.
        const success = await updateExpertProfile(expertId, { books });

        // Run the alert agent after a successful database update.
        if (success) {
            const updatedExpert = experts.find(e => e.id === expertId);
            if (updatedExpert) {
                runAlertAgent(updatedExpert, newBooks);
            }
        }
    };

    const updateExpertStatus = async (expertId: string, status: UserStatus) => {
        const expert = experts.find(e => e.id === expertId);
        if (expert?.isExample) {
            console.warn("Cannot change status of an example user.");
            return;
        }
        await updateExpertProfile(expertId, { status });
    };

    const deleteMultipleExperts = async (expertIds: string[]) => {
        const realIdsToDelete = expertIds.filter(id => {
            const expert = experts.find(e => e.id === id);
            return expert && !expert.isExample;
        });

        if (realIdsToDelete.length === 0) {
             setExperts(prev => prev.filter(e => !expertIds.includes(e.id)));
             return;
        }

        setIsErasing(true);
        try {
            await apiDeleteMultipleExperts(realIdsToDelete);
            setExperts(prev => prev.filter(e => !expertIds.includes(e.id)));
        } catch (error) {
            console.error("Failed to delete experts:", error);
            alert("An error occurred while deleting users.");
        } finally {
            setIsErasing(false);
        }
    };
    
    // WISHLIST MANAGEMENT
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const isBookInWishlist = useCallback((bookId: string) => {
        return wishlist.some(item => item.bookId === bookId);
    }, [wishlist]);

    const addToWishlist = useCallback((item: WishlistItem) => {
        setWishlist(prev => [...prev, item]);
    }, []);

    const removeFromWishlist = useCallback((bookId: string) => {
        setWishlist(prev => prev.filter(item => item.bookId !== bookId));
    }, []);

    // FILTERING
    const filteredExperts = useMemo(() => {
        return experts.filter(expert => {
            if (expert.role !== UserRole.EXPERT) return false;

            const matchesGenre = !genreFilter || expert.genre === genreFilter;
            
            const lowerCaseQuery = searchQuery.toLowerCase();
            const matchesSearch = !lowerCaseQuery ||
                expert.name.toLowerCase().includes(lowerCaseQuery) ||
                expert.genre.toLowerCase().includes(lowerCaseQuery) ||
                (expert.books || []).some(book => 
                    (book.title || '').toLowerCase().includes(lowerCaseQuery) ||
                    (book.author || '').toLowerCase().includes(lowerCaseQuery)
                ) ||
                (expert.bookQuery && (
                    expert.bookQuery.title.toLowerCase().includes(lowerCaseQuery) ||
                    expert.bookQuery.author.toLowerCase().includes(lowerCaseQuery)
                ));

            return matchesGenre && matchesSearch;
        });
    }, [experts, genreFilter, searchQuery]);


    // CONTEXT VALUE
    const contextValue: AppContextType = {
        experts,
        filteredExperts,
        currentUser,
        view,
        selectedExpertId,
        wishlist,
        isBookInWishlist,
        addToWishlist,
        removeFromWishlist,
        searchQuery,
        setSearchQuery,
        genreFilter,
        setGenreFilter,
        isLoading,
        setIsLoading,
        login,
        logout,
        addExpert,
        updateExpertProfile,
        updateExpertBooks,
        updateExpertStatus,
        deleteMultipleExperts,
        updatingExpertIds,
        isErasing,
        navigateToList,
        navigateToProfile,
        navigateToAdmin,
        navigateToTitleHive,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};