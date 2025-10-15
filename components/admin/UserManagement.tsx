import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Expert, UserStatus, SubscriptionTier, UserRole } from '../../types';
import Pagination from '../Pagination';
import { SparklesIcon, TrashIcon } from '../icons';

type UserFilter = 'all' | UserStatus | 'premium';
type AdminTab = 'experts' | 'system';

const UserManagement: React.FC = () => {
    const { experts, currentUser, updateExpertStatus, deleteMultipleExperts, updatingExpertIds, isErasing } = useAppContext();
    const [activeTab, setActiveTab] = useState<AdminTab>('experts');
    const [filter, setFilter] = useState<UserFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const EXPERTS_PER_PAGE = 10;
    
    useEffect(() => {
        setCurrentPage(1);
        setSelectedUserIds(new Set());
    }, [filter, searchTerm, activeTab]);

    const expertUsers = useMemo(() => {
        return experts
            .filter(expert => expert.role === UserRole.EXPERT)
            .filter(expert => {
                if (filter === 'all') return true;
                if (filter === 'premium') return expert.subscriptionTier === SubscriptionTier.PREMIUM;
                return expert.status === filter;
            })
            .filter(expert => {
                const search = searchTerm.toLowerCase();
                return expert.name.toLowerCase().includes(search) || expert.email.toLowerCase().includes(search);
            });
    }, [experts, filter, searchTerm]);

    const systemUsers = useMemo(() => {
        return experts.filter(expert => expert.role !== UserRole.EXPERT);
    }, [experts]);
    
    const usersForCurrentTab = activeTab === 'experts' ? expertUsers : systemUsers;

    const totalPages = Math.ceil(usersForCurrentTab.length / EXPERTS_PER_PAGE);
    const currentUsers = usersForCurrentTab.slice(
        (currentPage - 1) * EXPERTS_PER_PAGE,
        currentPage * EXPERTS_PER_PAGE
    );

    useEffect(() => {
        const currentUserIds = new Set(currentUsers.map(e => e.id));
        setSelectedUserIds(prevSelected => {
            const newSelected = new Set(prevSelected);
            let changed = false;
            newSelected.forEach(id => {
                if (!currentUserIds.has(id)) {
                    newSelected.delete(id);
                    changed = true;
                }
            });
            return changed ? newSelected : prevSelected;
        });
    }, [currentPage, currentUsers]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectedUserIds(new Set());
        }
    };

    const handleToggleSelection = (expertId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(expertId)) {
                newSet.delete(expertId);
            } else {
                newSet.add(expertId);
            }
            return newSet;
        });
    };
    
    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const selectableIds = currentUsers
                .filter(expert => expert.id !== currentUser?.id)
                .map(expert => expert.id);
            setSelectedUserIds(new Set(selectableIds));
        } else {
            setSelectedUserIds(new Set());
        }
    };
    
    const isAllOnPageSelected = useMemo(() => {
        const selectableUsersOnPage = currentUsers.filter(e => e.id !== currentUser?.id);
        if (selectableUsersOnPage.length === 0) return false;
        return selectableUsersOnPage.every(e => selectedUserIds.has(e.id));
    }, [selectedUserIds, currentUsers, currentUser]);
    
    const handleEraseSelected = async () => {
        const numSelected = selectedUserIds.size;
        const message = `Are you sure you want to PERMANENTLY ERASE ${numSelected} user(s)? This action is irreversible for real users.`;
        if (window.confirm(message)) {
            await deleteMultipleExperts(Array.from(selectedUserIds));
            setSelectedUserIds(new Set());
        }
    };
    
    const isAnActionRunningOnSelected = Array.from(selectedUserIds).some(id => updatingExpertIds.has(id));

    const getStatusBadgeClass = (status: UserStatus) => {
        const classMap: Record<UserStatus, string> = {
            [UserStatus.ACTIVE]: 'bg-green-100 text-green-800',
            [UserStatus.DISABLED]: 'bg-yellow-100 text-yellow-800',
        };
        return classMap[status] || 'bg-gray-100 text-gray-800';
    };
    
    const handleStatusToggle = async (expert: Expert) => {
        const newStatus = expert.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE;
        const action = newStatus === UserStatus.ACTIVE ? 'enable' : 'disable';
        const message = `Are you sure you want to ${action} ${expert.name}?`;
        if (window.confirm(message)) {
            // No local state, just call the context function
            await updateExpertStatus(expert.id, newStatus);
        }
    };
    
    const TabButton: React.FC<{ tab: AdminTab, label: string }> = ({ tab, label }) => {
      const isActive = activeTab === tab;
      return (
        <button
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            isActive ? 'bg-white border-b-0 text-customBlue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          role="tab"
          aria-selected={isActive}
        >
          {label}
        </button>
      );
    };

    return (
        <div className="animate-fade-in">
            <div className="flex border-b border-gray-200" role="tablist">
                <TabButton tab="experts" label="Experts" />
                <TabButton tab="system" label="System Accounts" />
            </div>

            <div className="bg-white p-6 rounded-b-lg shadow-lg border border-t-0 border-gray-200">
                {activeTab === 'experts' ? (
                    <>
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-1">Manage Experts</h2>
                                <p className="text-sm text-gray-500">View, filter, and manage all GO2 Expert accounts on the platform.</p>
                            </div>
                            {selectedUserIds.size > 0 && (
                                <div className="w-full md:w-auto">
                                    <button
                                        onClick={handleEraseSelected}
                                        disabled={isErasing || isAnActionRunningOnSelected}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-red-300 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        {isErasing ? 'Erasing...' : (
                                            <>
                                                <TrashIcon className="w-5 h-5" />
                                                Erase Selected ({selectedUserIds.size})
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </header>
                        
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-customBlue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>All</button>
                                <button onClick={() => setFilter(UserStatus.ACTIVE)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === UserStatus.ACTIVE ? 'bg-customBlue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>Active</button>
                                <button onClick={() => setFilter('premium')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === 'premium' ? 'bg-customBlue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>Premium</button>
                                <button onClick={() => setFilter(UserStatus.DISABLED)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === UserStatus.DISABLED ? 'bg-customBlue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>Disabled</button>
                            </div>
                            <input
                                type="search"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full md:w-64 px-4 py-2 border rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-customBlue-600"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="p-4">
                                           <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-customBlue-600 focus:ring-customBlue-600" onChange={handleSelectAllOnPage} checked={isAllOnPageSelected} aria-label="Select all users on this page"/>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enable/Disable</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentUsers.map(expert => {
                                        const isUpdating = updatingExpertIds.has(expert.id);
                                        const isCurrentUser = expert.id === currentUser?.id;
                                        return (
                                            <tr key={expert.id} className={`transition-colors ${selectedUserIds.has(expert.id) ? 'bg-customBlue-100/50' : 'hover:bg-gray-50'}`}>
                                                <td className="p-4">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-customBlue-600 focus:ring-customBlue-600 disabled:opacity-50 disabled:cursor-not-allowed" checked={selectedUserIds.has(expert.id)} onChange={() => handleToggleSelection(expert.id)} aria-label={`Select ${expert.name}`} disabled={isCurrentUser} title={isCurrentUser ? "You cannot select your own account." : ""}/>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img className="h-10 w-10 rounded-full object-cover" src={expert.avatarUrl} alt="" />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                                {expert.name}
                                                                {expert.isExample && <span className="text-xs font-bold text-customBlue-600 bg-customBlue-100 px-2 py-0.5 rounded-full">Example</span>}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{expert.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(expert.status)}`}>{expert.status}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    <div className="flex items-center gap-1.5">{expert.subscriptionTier === SubscriptionTier.PREMIUM && (<SparklesIcon className="w-4 h-4 text-yellow-500" />)}<span>{expert.subscriptionTier}</span></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center" title={isCurrentUser ? "You cannot modify your own account." : ""}>
                                                        <label htmlFor={`toggle-${expert.id}`} className={`flex justify-center items-center ${isUpdating || isCurrentUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                            <div className="relative">
                                                                <input type="checkbox" id={`toggle-${expert.id}`} className="sr-only peer" checked={expert.status === UserStatus.ACTIVE} onChange={() => handleStatusToggle(expert)} disabled={isUpdating || isCurrentUser}/>
                                                                <div className={`block bg-gray-200 w-12 h-7 rounded-full transition-colors peer-checked:bg-green-400 ${isUpdating || isCurrentUser ? 'opacity-50 grayscale' : ''}`}></div>
                                                                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full ${isUpdating || isCurrentUser ? 'opacity-50 grayscale' : ''}`}></div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                     {usersForCurrentTab.length === 0 && (<tr><td colSpan={5} className="text-center py-12 text-gray-500">No experts found matching your criteria.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange}/>
                    </>
                ) : (
                     <div>
                        <header className="mb-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">System Accounts</h2>
                            <p className="text-sm text-gray-500">Read-only view of non-expert accounts like administrators. These accounts cannot be modified from this panel.</p>
                        </header>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt="" />
                                                    <div className="ml-4">
                                                         <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                            {user.name}
                                                            {user.isExample && <span className="text-xs font-bold text-customBlue-600 bg-customBlue-100 px-2 py-0.5 rounded-full">Example</span>}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase font-semibold">{user.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(user.status)}`}>{user.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentUsers.length === 0 && (<tr><td colSpan={3} className="text-center py-12 text-gray-500">No system accounts found.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange}/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;