import React, { createContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Expert, BookGenre, WishlistItem, UserRole, UserStatus, Book, SubscriptionTier, BookStatus } from '../types';
import { getExperts, createExpert, updateExpert, deleteMultipleExperts as apiDeleteMultipleExperts, DuplicateEmailError } from '../services/apiService';
import { ADMIN_CREDENTIALS, ADMIN_USER_OBJECT } from '../constants';
import { supabase } from '../supabaseClient';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getExpertSlug, findExpertBySlugOrId } from '../utils/slug';


// Define the shape of the context
interface AppContextType {
    experts: Expert[];
    filteredExperts: Expert[];
    currentUser: Expert | null;
    view: 'list' | 'profile' | 'admin' | 'title-hive' | 'terms' | 'privacy' | 'go-premium';
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
    addExpert: (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'status' | 'subscriptionTier' | 'books' | 'spotlights' | 'onLeave'>) => Promise<boolean>;
    updateExpertProfile: (expertId: string, profileData: Partial<Expert>) => Promise<boolean>;
    refreshCurrentUser: (updatedUser: Expert) => void;
    updateExpertBooks: (expertId: string, books: Book[]) => Promise<void>;
    updateExpertStatus: (expertId: string, status: UserStatus) => Promise<void>;
    deleteMultipleExperts: (expertIds: string[]) => Promise<void>;
    updatingExpertIds: Set<string>;
    isErasing: boolean;
    navigateToList: () => void;
    navigateToProfile: (expertId: string, bookId?: string) => void;
    navigateToAdmin: () => void;
    navigateToTitleHive: () => void;
    navigateToTerms: () => void;
    navigateToPrivacy: () => void;
    navigateToPremium: () => void;
}

// Create the context with a default undefined value
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Define the provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // STATE MANAGEMENT
    const [experts, setExperts] = useState<Expert[]>([]);
    const [currentUser, setCurrentUser] = useState<Expert | null>(null);
    const [view, setView] = useState<'list' | 'profile' | 'admin' | 'title-hive' | 'terms' | 'privacy' | 'go-premium'>('list');
    const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [genreFilter, setGenreFilter] = useState<BookGenre | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingExpertIds, setUpdatingExpertIds] = useState<Set<string>>(new Set());
    const [isErasing, setIsErasing] = useState(false);

    // Safe session storage helper to prevent browser QuotaExceededError crashes
    const safeSetSessionUser = useCallback((user: Expert | null) => {
        try {
            if (!user) {
                sessionStorage.removeItem('currentUser');
                return;
            }
            // Store lightweight user session info without heavy nested book arrays
            const sessionPayload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                subscriptionTier: user.subscriptionTier,
            };
            sessionStorage.setItem('currentUser', JSON.stringify(sessionPayload));
        } catch (e) {
            console.warn('Session storage quota exceeded or unavailable:', e);
        }
    }, []);

    // DATA FETCHING & INITIALIZATION
    useEffect(() => {
        const fetchAndSetExperts = async () => {
            setIsLoading(true);
            try {
                const dbExperts = await getExperts();
                setExperts(dbExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } catch (error) {
                console.error("Failed to fetch experts:", error);
                setExperts([]); // Fallback to empty array on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndSetExperts();

        try {
            const storedWishlist = localStorage.getItem('wishlist');
            if (storedWishlist) {
                setWishlist(JSON.parse(storedWishlist));
            }
        } catch (e) {
            console.warn('Failed to parse stored wishlist:', e);
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
              safeSetSessionUser(null);
              setView('list');
            } else {
              if (user.email?.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
                const adminUser = ADMIN_USER_OBJECT;
                setCurrentUser(adminUser);
                safeSetSessionUser(adminUser);
              } else {
                // The experts list might not be loaded yet, especially on initial load.
                // We ensure it is loaded before trying to find the user.
                let allExperts = experts;
                if (allExperts.length === 0) {
                  const dbExperts = await getExperts();
                  allExperts = dbExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  setExperts(allExperts);
                }
    
                const loggedInExpert = allExperts.find(e => e.email.toLowerCase() === user.email?.toLowerCase());
    
                if (loggedInExpert) {
                  setCurrentUser(loggedInExpert);
                  safeSetSessionUser(loggedInExpert);
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
    }, [experts, safeSetSessionUser]); // Rerun if experts list changes


    // SYNCHRONIZE VIEW & SELECTED EXPERT WITH CURRENT ROUTE
    useEffect(() => {
        const pathname = location.pathname;
        if (pathname.startsWith('/profile/')) {
            const parts = pathname.split('/');
            const identifier = parts[2];
            setView('profile');
            if (identifier) {
                // If experts are already loaded, resolve to actual ID
                const matched = findExpertBySlugOrId(identifier, experts);
                if (matched) {
                    setSelectedExpertId(matched.id);
                } else {
                    setSelectedExpertId(identifier);
                }
            }
        } else if (pathname === '/admin') {
            setView('admin');
        } else if (pathname === '/titlehive' || pathname === '/title-hive' || pathname === '/hive') {
            setView('title-hive');
        } else if (pathname === '/terms') {
            setView('terms');
        } else if (pathname === '/privacy') {
            setView('privacy');
        } else if (pathname === '/premium' || pathname === '/go-premium') {
            setView('go-premium');
        } else if (pathname === '/') {
            setView('list');
            setSelectedExpertId(null);
        }
    }, [location.pathname, experts]);

    // NAVIGATION
    const navigateToList = useCallback(() => {
        setSelectedExpertId(null);
        setSearchQuery('');
        navigate('/');
    }, [navigate]);

    const navigateToProfile = useCallback((expertId: string, bookId?: string) => {
        setSelectedExpertId(expertId);
        const targetExpert = experts.find(e => e.id === expertId);
        const slugOrId = targetExpert ? getExpertSlug(targetExpert, experts) : expertId;
        if (bookId) {
            navigate(`/profile/${slugOrId}/book/${bookId}`);
        } else {
            navigate(`/profile/${slugOrId}`);
        }
    }, [navigate, experts]);
    
    // Backward compatibility with legacy hash links (e.g. #/profile/:id)
    useEffect(() => {
        const hash = window.location.hash;
        const profileMatch = hash.match(/^#\/profile\/(.+)$/);
        if (profileMatch && profileMatch[1]) {
            const identifier = profileMatch[1];
            const matched = findExpertBySlugOrId(identifier, experts);
            const slugOrId = matched ? getExpertSlug(matched, experts) : identifier;
            navigate(`/profile/${slugOrId}`, { replace: true });
        }
    }, [navigate, experts]);

    // Scroll-to-top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const navigateToAdmin = useCallback(() => {
        if (currentUser?.role === UserRole.ADMIN) {
            navigate('/admin');
        }
    }, [currentUser, navigate]);

    const navigateToTitleHive = useCallback(() => {
        navigate('/titlehive');
    }, [navigate]);

    const navigateToTerms = useCallback(() => {
        navigate('/terms');
    }, [navigate]);

    const navigateToPrivacy = useCallback(() => {
        navigate('/privacy');
    }, [navigate]);

    const navigateToPremium = useCallback(() => {
        navigate('/premium');
    }, [navigate]);


    // USER & AUTHENTICATION
    const sendLoginOtp = async (email: string): Promise<{ error: Error | null }> => {
        const normalizedEmail = email.toLowerCase().trim();
        
        if (normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
            // For the admin, we always allow user creation. If the auth user doesn't exist,
            // this will create it. If it exists, it will just send the OTP. This makes the
            // admin login robust across different environments.
            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: { shouldCreateUser: true }
            });
            // The onAuthStateChange listener will handle the successful login.
            return { error };
        }
        
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
        navigate('/');
    }, [navigate]);

    // EXPERT DATA MANAGEMENT
    const addExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'status' | 'subscriptionTier' | 'books' | 'spotlights' | 'onLeave'>): Promise<boolean> => {
        setIsLoading(true);
        try {
            const newExpertPayload: Omit<Expert, 'id' | 'createdAt' | 'updatedAt'> = {
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
                safeSetSessionUser(updatedCurrentUser);
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

    const refreshCurrentUser = useCallback((updatedUser: Expert) => {
        setCurrentUser(updatedUser);
        safeSetSessionUser(updatedUser);
        setExperts(prevExperts => {
            const newExperts = prevExperts.map(e => e.id === updatedUser.id ? { ...e, ...updatedUser } : e);
            return newExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }, [safeSetSessionUser]);

    const updateExpertBooks = async (expertId: string, books: Book[]): Promise<void> => {
        setUpdatingExpertIds(prev => new Set(prev).add(expertId));
        try {
            await updateExpert(expertId, { books });
            setExperts(prevExperts => {
                const newExperts = prevExperts.map(e => e.id === expertId ? { ...e, books } : e);
                return newExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
            if (currentUser?.id === expertId) {
                setCurrentUser(prev => prev ? { ...prev, books } : null);
            }
        } catch (error) {
            console.error("Failed to update expert books:", error);
            alert(`Failed to update books: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
        } finally {
            setUpdatingExpertIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(expertId);
                return newSet;
            });
        }
    };

    const updateExpertStatus = async (expertId: string, status: UserStatus): Promise<void> => {
        setUpdatingExpertIds(prev => new Set(prev).add(expertId));
        try {
            await updateExpert(expertId, { status });
            setExperts(prevExperts => {
                const newExperts = prevExperts.map(e => e.id === expertId ? { ...e, status } : e);
                return newExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
            if (currentUser?.id === expertId) {
                setCurrentUser(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error("Failed to update expert status:", error);
            alert(`Failed to update status: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
        } finally {
            setUpdatingExpertIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(expertId);
                return newSet;
            });
        }
    };

    const deleteMultipleExperts = async (expertIds: string[]): Promise<void> => {
        setIsErasing(true);
        try {
            await apiDeleteMultipleExperts(expertIds);
            setExperts(prevExperts => prevExperts.filter(e => !expertIds.includes(e.id)));
            if (currentUser && expertIds.includes(currentUser.id)) {
                await logout();
            }
        } catch (error) {
            console.error("Failed to delete experts:", error);
            alert(`Failed to delete experts: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
        } finally {
            setIsErasing(false);
        }
    };

    // WISHLIST MANAGEMENT
    const isBookInWishlist = (bookId: string): boolean => {
        return wishlist.some(item => item.book.id === bookId);
    };

    const addToWishlist = (item: WishlistItem) => {
        setWishlist(prevWishlist => {
            const updated = [...prevWishlist, item];
            try {
                localStorage.setItem('wishlist', JSON.stringify(updated));
            } catch (e) {
                console.warn('Failed to save wishlist to local storage:', e);
            }
            return updated;
        });
    };

    const removeFromWishlist = (bookId: string) => {
        setWishlist(prevWishlist => {
            const updated = prevWishlist.filter(item => item.book.id !== bookId);
            try {
                localStorage.setItem('wishlist', JSON.stringify(updated));
            } catch (e) {
                console.warn('Failed to save wishlist to local storage:', e);
            }
            return updated;
        });
    };

    // FILTERED EXPERTS MEMO
    const filteredExperts = useMemo(() => {
        return experts.filter(expert => {
            if (expert.status !== UserStatus.ACTIVE) {
                return false;
            }
            const matchesGenre = !genreFilter || expert.genre === genreFilter;
            
            if (!searchQuery) {
                return matchesGenre;
            }

            const query = searchQuery.toLowerCase();
            const matchesName = expert.name.toLowerCase().includes(query);
            const matchesLocation = expert.location ? expert.location.toLowerCase().includes(query) : false;
            const matchesBooks = (expert.books || []).some(book => 
                book.status === BookStatus.APPROVED &&
                (book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query))
            );

            return matchesGenre && (matchesName || matchesLocation || matchesBooks);
        });
    }, [experts, genreFilter, searchQuery]);

    const contextValue = {
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
        refreshCurrentUser,
        updateExpertBooks,
        updateExpertStatus,
        deleteMultipleExperts,
        updatingExpertIds,
        isErasing,
        navigateToList,
        navigateToProfile,
        navigateToAdmin,
        navigateToTitleHive,
        navigateToTerms,
        navigateToPrivacy,
        navigateToPremium,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
