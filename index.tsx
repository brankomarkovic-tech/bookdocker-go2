import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { UserRole } from './types';

import Header from './components/Header';
import Footer from './components/Footer';
import ExpertList from './components/ExpertList';
import ExpertProfile from './components/ExpertProfile';
import AdminPanel from './components/AdminPanel';
import TitleHive from './components/TitleHive';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';

const mainContentStyle = "flex-grow";

// This component manages which public view is shown based on context state,
// avoiding URL changes for navigation between the list and profile.
const PublicViewManager: React.FC = () => {
    const { view, selectedExpertId } = useAppContext();

    if (view === 'profile' && selectedExpertId) {
        return <ExpertProfile />;
    }
    if (view === 'title-hive') {
        return <TitleHive />;
    }
    if (view === 'terms') {
        return <TermsAndConditions />;
    }
    if (view === 'privacy') {
        return <PrivacyPolicy />;
    }
    return <ExpertList />;
};

// This is the main application component that decides which top-level view to render.
// It switches between the Admin Panel and the Public Site based on context state.
const AppManager: React.FC = () => {
    const { view, currentUser } = useAppContext();

    const isAdmin = currentUser?.role === UserRole.ADMIN;

    if (isAdmin && view === 'admin') {
        return <AdminPanel />;
    }

    // Default to the public-facing application view
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className={mainContentStyle}>
                <PublicViewManager />
            </main>
            <Footer />
        </div>
    );
};


// The router is now extremely simple. It only has one route that renders
// the AppManager, which handles all view logic internally.
const router = createHashRouter([
    {
        path: "*",
        element: <AppManager />,
    }
]);

const renderApp = () => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </React.StrictMode>
    );
};

// Defer script execution until the DOM is fully loaded to prevent race conditions.
// This is the most robust way to ensure UI elements are available before scripts try to interact with them.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    // The DOM is already loaded, we can run the app immediately.
    renderApp();
}