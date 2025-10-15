import React, { useState } from 'react';
import { Logo } from './Logo';
import Dashboard from './admin/Dashboard';
import AIAgent from './admin/AIAgent';
import { BookIcon, SparklesIcon, ShieldExclamationIcon, CogIcon } from './icons';
import ContentModeration from './admin/ContentModeration';
import UserManagement from './admin/UserManagement';
import { useAppContext } from '../hooks/useAppContext';

type AdminView = 'dashboard' | 'user-management' | 'content-moderation' | 'ai-agent';

const AdminPanel: React.FC = () => {
    const { navigateToList } = useAppContext();
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

    const NavButton: React.FC<{
      view: AdminView;
      label: string;
      icon: React.ReactNode;
    }> = ({ view, label, icon }) => {
      const isActive = activeView === view;
      const baseClasses = "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors duration-200";
      const activeClasses = "bg-customBlue-700 text-white font-semibold shadow-inner";
      const inactiveClasses = "text-customBlue-100 hover:bg-customBlue-900/50 hover:text-white";

      return (
        <button
          onClick={() => setActiveView(view)}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          aria-current={isActive ? 'page' : undefined}
        >
          {icon}
          <span>{label}</span>
        </button>
      );
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'user-management': return <UserManagement />;
            case 'content-moderation': return <ContentModeration />;
            case 'ai-agent': return <AIAgent />;
            default: return <Dashboard />;
        }
    };
    
    const getHeaderText = () => {
        const viewTitles: Record<AdminView, string> = {
            dashboard: 'Platform Dashboard',
            'user-management': 'User Management',
            'content-moderation': 'Content Moderation',
            'ai-agent': 'AI Administrative Agent'
        };
        return viewTitles[activeView];
    }


    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-customBlue-800 text-white flex flex-col shadow-lg flex-shrink-0">
                <header className="flex items-center justify-center gap-3 p-6 border-b border-customBlue-700/50">
                    <Logo className="w-10 h-10 text-white" />
                    <span className="text-xl font-bold">Admin Panel</span>
                </header>
                <nav className="flex-grow p-4 space-y-2">
                    <NavButton view="dashboard" label="Dashboard" icon={<BookIcon className="w-6 h-6" />} />
                    <NavButton view="user-management" label="User Management" icon={<CogIcon className="w-6 h-6" />} />
                    <NavButton view="content-moderation" label="Content Moderation" icon={<ShieldExclamationIcon className="w-6 h-6" />} />
                    <NavButton view="ai-agent" label="AI Agent" icon={<SparklesIcon className="w-6 h-6" />} />
                </nav>
                <footer className="p-4 border-t border-customBlue-700/50">
                    <button
                        onClick={navigateToList}
                        className="w-full text-center block py-2 px-4 rounded-lg bg-customBlue-100 text-customBlue-800 font-semibold hover:bg-white transition-colors no-underline"
                    >
                        Exit Admin
                    </button>
                </footer>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm z-10">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-800">
                           {getHeaderText()}
                        </h1>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                   {renderView()}
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;