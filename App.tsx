import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { UserRole } from './types';
import { getExpertSlug } from './utils/slug';

import Header from './components/Header';
import Footer from './components/Footer';
import ExpertList from './components/ExpertList';
import ExpertProfile from './components/ExpertProfile';
import AdminPanel from './components/AdminPanel';
import TitleHive from './components/TitleHive';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import GoPremium from './components/GoPremium';

// Redirects a direct /book/:bookId link to the expert's profile containing that book
const BookRedirectHandler: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const { experts, isLoading } = useAppContext();
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customBlue-600"></div>
            </div>
        );
    }

    const expert = experts.find(e => (e.books || []).some(b => b.id === bookId));
    if (expert && bookId) {
        const slug = getExpertSlug(expert, experts);
        return <Navigate to={`/profile/${slug}/book/${bookId}`} replace />;
    }
    return <Navigate to="/" replace />;
};

// Protected Admin route handler
const AdminRoute: React.FC = () => {
    const { currentUser, isLoading } = useAppContext();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customBlue-600"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <AdminPanel />;
};

// Main application router layout
const AppManager: React.FC = () => {
    return (
        <Routes>
            <Route path="/admin/*" element={<AdminRoute />} />
            <Route
                path="/*"
                element={
                    <div className="flex flex-col min-h-screen bg-gray-50">
                        <Header />
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/" element={<ExpertList />} />
                                <Route path="/profile/:expertId" element={<ExpertProfile />} />
                                <Route path="/profile/:expertId/book/:bookId" element={<ExpertProfile />} />
                                <Route path="/book/:bookId" element={<BookRedirectHandler />} />
                                <Route path="/titlehive" element={<TitleHive />} />
                                <Route path="/title-hive" element={<TitleHive />} />
                                <Route path="/hive" element={<Navigate to="/titlehive" replace />} />
                                <Route path="/terms" element={<TermsAndConditions />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/premium" element={<GoPremium />} />
                                <Route path="/go-premium" element={<Navigate to="/premium" replace />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                }
            />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
        <AppProvider>
            <AppManager />
        </AppProvider>
    </BrowserRouter>
  );
};

export default App;
