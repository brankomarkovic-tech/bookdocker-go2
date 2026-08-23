import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Expert, Book, WishlistItem, UserRole } from '../types';
import { supabase } from '../supabaseClient';
import { getExperts, updateExpert, deleteExpert, createExpert } from '../services/apiService';
import { ADMIN_CREDENTIALS } from '../constants';

interface AppContextType {
    experts: Expert[];
    loading: boolean;
    error: string | null;
    currentUser: Expert | null;
    view: string;
    selectedExpertId: string | null;
    isLoginModalOpen: boolean;
    isRegisterModalOpen: boolean;
    isInquiryModalOpen: boolean;
    isWishlistModalOpen: boolean;
    isAudioPlayerOpen: boolean;
    selectedBookForInquiry: { book: Book; expert: Expert } | null;
    selectedAudioBook: Book | null;
    wishlist: WishlistItem[];
    isScanning: boolean;
    updatingExpertIds: Set<string>;
    isErasing: boolean;
    setView: (view: string) => void;
    setSelectedExpertId: (id: string | null) => void;
    setIsLoginModalOpen: (isOpen: boolean) => void;
    setIsRegisterModalOpen: (isOpen: boolean) => void;
    setIsInquiryModalOpen: (isOpen: boolean) => void;
    setIsWishlistModalOpen: (isOpen: boolean) => void;
    setIsAudioPlayerOpen: (isOpen: boolean) => void;
    setSelectedBookForInquiry: (data: { book: Book; expert: Expert } | null) => void;
    setSelectedAudioBook: (book: Book | null) => void;
    setIsScanning: (isScanning: boolean) => void;
    handleLogin: (email: string, role?: UserRole) => Promise<boolean>;
    handleLogout: () => Promise<void>;
    updateExpertProfile: (expertId: string, profileData: Partial<Expert>) => Promise<boolean>;
    deleteExpertProfile: (expertId: string) => Promise<boolean>;
    createNewExpert: (expertData: Omit<Expert, 'id' | 'createdAt' | 'status' | 'role' | 'subscriptionTier' | 'books'>) => Promise<boolean>;
    addToWishlist: (book: Book, expert: Expert) => void;
    removeFromWishlist: (bookId: string) => void;
    isBookInWishlist: (bookId: string) => boolean;
    handleUpdateExpertOptimistic: (updatedUser: Expert) => void;
    runAlertAgent: (updatedExpert: Expert, newBooks: Book[]) => void;
    fetchAndSetExperts: () => Promise<void>;
    eraseAllUnapprovedExperts: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const adminUser: Expert = {
    id: 'admin-user',
    name: 'Admin',
    email: ADMIN_CREDENTIALS.email,
    role: UserRole.ADMIN,
    genre: 'Platform Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
    bio: 'Platform Administrator',
    createdAt: new Date().toISOString(),
    status: 'active',
    subscriptionTier: 'premium',
    books: []
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<Expert | null>(null);
    const [view, setView] = useState<string>('list');
    const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
    const [selectedBookForInquiry, setSelectedBookForInquiry] = useState<{ book: Book; expert: Expert } | null>(null);
    const [selectedAudioBook, setSelectedAudioBook] = useState<Book | null>(null);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
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
    const fetchAndSetExperts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getExperts();
            setExperts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load experts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    // AUTH STATE SYNCHRONIZATION
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user;
    
            if (!user) {
              setCurrentUser(null);
              safeSetSessionUser(null);
              setView('list');
            } else {
              if (user.email?.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
                setCurrentUser(adminUser);
                safeSetSessionUser(adminUser);
              } else {
                if (experts.length === 0) {
                    return; 
                }
                
                const loggedInExpert = experts.find(
                  (expert) => expert.email?.toLowerCase() === user.email?.toLowerCase()
                );
    
                if (loggedInExpert) {
                  setCurrentUser(loggedInExpert);
                  safeSetSessionUser(loggedInExpert);
                } else {
                  console.error("Authenticated user not found in expert list:", user.email);
                  await supabase.auth.signOut();
                  setCurrentUser(null);
                  safeSetSessionUser(null);
                  alert("Your account is authenticated, but no corresponding expert profile was found. You have been logged out.");
                }
              }
            }
        });
    
        return () => {
          subscription.unsubscribe();
        };
    }, [experts, safeSetSessionUser]);

    // LOGIN / LOGOUT HANDLERS
    const handleLogin = async (email: string, role?: UserRole): Promise<boolean> => {
        if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
            setCurrentUser(adminUser);
            safeSetSessionUser(adminUser);
            setIsLoginModalOpen(false);
            setView('admin');
            return true;
        }

        const expert = experts.find(e => e.email?.toLowerCase() === email.toLowerCase());
        if (expert) {
            if (role && expert.role !== role) {
                alert(`User does not have the role ${role}`);
                return false;
            }
            setCurrentUser(expert);
            safeSetSessionUser(expert);
            setIsLoginModalOpen(false);
            return true;
        }
        
        return false;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        safeSetSessionUser(null);
        setView('list');
    };

    // EXPERT CRUD OPERATIONS
    const updateExpertProfile = async (expertId: string, profileData: Partial<Expert>): Promise<boolean> => {
        try {
            setUpdatingExpertIds(prev => new Set(prev).add(expertId));
            const updatedExpert = await updateExpert(expertId, profileData);
            setExperts(prev => prev.map(e => (e.id === expertId ? updatedExpert : e)));
            if (currentUser?.id === expertId) {
                const updatedCurrentUser = { ...currentUser, ...updatedExpert };
                setCurrentUser(updatedCurrentUser);
                safeSetSessionUser(updatedCurrentUser);
            }
            return true;
        } catch (error: any) {
            console.error("Failed to update expert profile:", error);
            alert(`Failed to update profile: ${error.message}`);
            return false;
        } finally {
            setUpdatingExpertIds(prev => {
                const next = new Set(prev);
                next.delete(expertId);
                return next;
            });
        }
    };

    const deleteExpertProfile = async (expertId: string): Promise<boolean> => {
        try {
            await deleteExpert(expertId);
            setExperts(prev => prev.filter(e => e.id !== expertId));
            if (currentUser?.id === expertId) {
                await handleLogout();
            }
            return true;
        } catch (error: any) {
            console.error("Failed to delete expert profile:", error);
            alert(`Failed to delete profile: ${error.message}`);
            return false;
        }
    };

    const createNewExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'status' | 'role' | 'subscriptionTier' | 'books'>): Promise<boolean> => {
        try {
            const newExpert = await createExpert(expertData);
            setExperts(prev => [newExpert, ...prev]);
            return true;
        } catch (error: any) {
            console.error("Failed to create new expert profile:", error);
            alert(`Failed to submit profile: ${error.message}`);
            return false;
        }
    };

    const handleUpdateExpertOptimistic = useCallback((updatedUser: Expert) => {
        setExperts(prevExperts => {
            const newExperts = prevExperts.map(e => e.id === updatedUser.id ? updatedUser : e);
            return newExperts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
        setCurrentUser(updatedUser);
        safeSetSessionUser(updatedUser);
    }, [safeSetSessionUser]);
    
    const runAlertAgent = (updatedExpert: Expert, newBooks: Book[]) => {
        if (newBooks.length === 0) return;
        
        console.log(`AI Agent checking alerts for ${newBooks.length} new books from ${updatedExpert.name}`);
    };

    const eraseAllUnapprovedExperts = async () => {
        if (currentUser?.role !== UserRole.ADMIN) {
            alert('Only administrators can perform this action.');
            return;
        }

        const unapprovedExperts = experts.filter(e => e.status === 'pending' || e.status === 'rejected');
        if (unapprovedExperts.length === 0) {
            alert('No pending or rejected expert profiles found to erase.');
            return;
        }

        const confirmErase = window.confirm(
            `Are you sure you want to permanently erase ${unapprovedExperts.length} unapproved expert profile(s)? This action cannot be undone.`
        );

        if (!confirmErase) return;

        setIsErasing(true);
        try {
            for (const expert of unapprovedExperts) {
                await deleteExpert(expert.id);
            }
            setExperts(prev => prev.filter(e => e.status === 'active'));
            alert(`Successfully erased ${unapprovedExperts.length} unapproved profile(s).`);
        } catch (error: any) {
            console.error('Error erasing unapproved experts:', error);
            alert(`Failed to erase unapproved experts: ${error.message}`);
        } finally {
            setIsErasing(false);
        }
    };

    // WISHLIST MANAGEMENT
    useEffect(() => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        } catch (e) {
            console.warn('Failed to save wishlist to localStorage:', e);
        }
    }, [wishlist]);

    const isBookInWishlist = useCallback((bookId: string) => {
        return wishlist.some(item => item.book.id === bookId);
    }, [wishlist]);

    const addToWishlist = useCallback((book: Book, expert: Expert) => {
        setWishlist(prev => {
            if (prev.some(item => item.book.id === book.id)) return prev;
            return [...prev, { book, expert, addedAt: new Date().toISOString() }];
        });
    }, []);

    const removeFromWishlist = useCallback((bookId: string) => {
        setWishlist(prev => prev.filter(item => item.book.id !== bookId));
    }, []);

    return (
        <AppContext.Provider
            value={{
                experts,
                loading,
                error,
                currentUser,
                view,
                selectedExpertId,
                isLoginModalOpen,
                isRegisterModalOpen,
                isInquiryModalOpen,
                isWishlistModalOpen,
                isAudioPlayerOpen,
                selectedBookForInquiry,
                selectedAudioBook,
                wishlist,
                isScanning,
                updatingExpertIds,
                isErasing,
                setView,
                setSelectedExpertId,
                setIsLoginModalOpen,
                setIsRegisterModalOpen,
                setIsInquiryModalOpen,
                setIsWishlistModalOpen,
                setIsAudioPlayerOpen,
                setSelectedBookForInquiry,
                setSelectedAudioBook,
                setIsScanning,
                handleLogin,
                handleLogout,
                updateExpertProfile,
                deleteExpertProfile,
                createNewExpert,
                addToWishlist,
                removeFromWishlist,
                isBookInWishlist,
                handleUpdateExpertOptimistic,
                runAlertAgent,
                fetchAndSetExperts,
                eraseAllUnapprovedExperts,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
