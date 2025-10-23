import React, { createContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Expert, BookGenre, WishlistItem, UserRole, UserStatus, Book, SubscriptionTier, BookStatus } from '../types';
import { getExperts, createExpert, updateExpert, deleteMultipleExperts as apiDeleteMultipleExperts, DuplicateEmailError } from '../services/apiService';
import { EXAMPLE_EXPERTS } from '../exampleData';
import { ADMIN_CREDENTIALS, ADMIN_USER_OBJECT } from '../constants';
import { supabase } from '../supabaseClient';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';


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
    sendLoginOtp: (email: string) => Promise<{ error: Error | null }>;
    verifyLoginOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
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
                // Auth listener will handle setting loading to false
            }
        };

        fetchAndSetExperts();

        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
            setWishlist(JSON.parse(storedWishlist));
        }
    }, []);

    // REAL-TIME AUTHENTICATION LISTENER
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            setIsLoading(true);
            const user = session?.user;
    
            if (!user) {
              setCurrentUser(null);
              sessionStorage.removeItem('currentUser');
              setView('list');
            } else {
              if (user.email?.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
                const adminUser = ADMIN_USER_OBJECT;
                setCurrentUser(adminUser);
                sessionStorage.setItem('currentUser', JSON.stringify(adminUser));
              } else {
                // The experts list might not be loaded yet, especially on initial load.
                // We ensure it is loaded before trying to find the user.
                let allExperts = experts;
                if (allExperts.length === 0) {
                  const dbExperts = await getExperts();
                  allExperts = [...EXAMPLE_EXPERTS, ...dbExperts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  setExperts(allExperts);
                }
    
                const loggedInExpert = allExperts.find(e => e.email.toLowerCase() === user.email?.toLowerCase());
    
                if (loggedInExpert) {
                  setCurrentUser(loggedInExpert);
                  sessionStorage.setItem('currentUser', JSON.stringify(loggedInExpert));
                } else {
                  console.error("Authenticated user not found in expert list:", user.email);
                  // This user is authenticated but has no profile. Log them out.
                  await supabase.auth.signOut();
                }
              }
            }
            setIsLoading(false);
          }
        );
    
        return () => {
          subscription.unsubscribe();
        };
    }, [experts]); // Rerun if experts list changes


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

    // Scroll-to-top on view change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);


    const navigateToAdmin = useCallback(() => {
        if (currentUser?.role === UserRole.ADMIN) {
            setView('admin');
        }
    }, [currentUser]);

    const navigateToTitleHive = useCallback(() => {
        setView('title-hive');
    }, []);

    // USER & AUTHENTICATION
    const sendLoginOtp = async (email: string): Promise<{ error: Error | null }> => {
        const normalizedEmail = email.toLowerCase().trim();
        
        // First attempt: Standard login for existing users.
        let { error } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
                shouldCreateUser: false,
            }
        });
    
        // If it fails because signups are not allowed, it means the auth user doesn't exist.
        // Let's check if they have a profile in our DB.
        if (error && error.message.includes('Signups not allowed for otp')) {
            const expertExists = experts.some(e => e.email.toLowerCase() === normalizedEmail);
    
            // If a profile exists, this is a user from before the auth fix.
            // We should "heal" their account by creating an auth user for them.
            if (expertExists) {
                console.warn(`Auth user for ${normalizedEmail} not found, but profile exists. Attempting to create auth user to self-heal account.`);
                // Retry, but this time allow user creation.
                const { error: creationError } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        shouldCreateUser: true,
                    }
                });
                // The result of this second call is the one we return.
                return { error: creationError };
            } else {
                // If no profile exists either, then it's a true unknown user.
                // Provide a more specific error message.
                return { error: new Error("No account found with this email. Please sign up using the 'Be GO2' button.") };
            }
        }
    
        // Return the original error or null if successful.
        return { error };
    };

    const verifyLoginOtp = async (email: string, token: string): Promise<{ error: Error | null }> => {
        const { error } = await supabase.auth.verifyOtp({
            email: email.toLowerCase().trim(),
            token: token.trim(),
            type: 'email',
        });
        // The onAuthStateChange listener will handle the successful login.
        return { error };
    };


    const logout = useCallback(async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        // The onAuthStateChange listener handles state cleanup.
        setIsLoading(false);
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
            
            // This is the crucial change. For a new user, we call signInWithOtp
            // allowing it to create an entry in the Supabase auth table.
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: createdExpert.email.toLowerCase().trim(),
                options: {
                    shouldCreateUser: true,
                }
            });

            if (otpError) {
                // This is a critical failure. The profile was created, but the auth user wasn't.
                // This leaves an orphaned profile. We should ideally roll back the creation.
                // For now, alerting the user is the simplest fix.
                console.error("Critical error: Profile created but failed to create auth user:", otpError);
                alert("Your profile was created, but we failed to create your login account. Please try signing in from the main login page. If the problem persists, contact support.");
            } else {
                alert("Profile created! Check your email for a one-time code to log in.");
            }
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
        sendLoginOtp,
        verifyLoginOtp,
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