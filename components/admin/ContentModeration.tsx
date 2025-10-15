import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { scanContentForIssues } from '../../services/geminiService';
import { ModerationAlert, UserStatus } from '../../types';
import { ShieldCheckIcon, ShieldExclamationIcon, TrashIcon } from '../icons';

const ContentModeration: React.FC = () => {
    const { experts, currentUser, updateExpertStatus, deleteMultipleExperts, updatingExpertIds, isErasing } = useAppContext();
    const [alerts, setAlerts] = useState<ModerationAlert[]>([]);
    const [isScanLoading, setIsScanLoading] = useState(false);
    const [scanPerformed, setScanPerformed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedExpertIds, setSelectedExpertIds] = useState<Set<string>>(new Set());
    
    const handleScan = useCallback(async () => {
        setIsScanLoading(true);
        setError(null);
        setScanPerformed(true);
        setSelectedExpertIds(new Set());
        try {
            const manageableExperts = experts.filter(e => !e.isExample);
            const results = await scanContentForIssues(manageableExperts);
            setAlerts(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during moderation scan.");
            console.error(err);
        } finally {
            setIsScanLoading(false);
        }
    }, [experts]);
    
    useEffect(() => {
        handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleStatusToggle = async (expertId: string, expertName: string, currentStatus: UserStatus) => {
        const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE;
        const action = newStatus === UserStatus.ACTIVE ? 'enable' : 'disable';
        const message = `Are you sure you want to ${action} ${expertName}?`;
    
        if (window.confirm(message)) {
            // No local state management, just call the context function.
            await updateExpertStatus(expertId, newStatus);
        }
    };

    const handleToggleSelection = (expertId: string) => {
        setSelectedExpertIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(expertId)) {
                newSet.delete(expertId);
            } else {
                newSet.add(expertId);
            }
            return newSet;
        });
    };

    const handleEraseSelected = async () => {
        const numSelected = selectedExpertIds.size;
        const message = `Are you sure you want to PERMANENTLY ERASE ${numSelected} user(s) associated with these alerts? This action is irreversible.`;
        if (window.confirm(message)) {
            await deleteMultipleExperts(Array.from(selectedExpertIds));
            setSelectedExpertIds(new Set());
        }
    };

    const getContentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            bio: 'Bio',
            blogPostTitle: 'Spotlight Title',
            blogPostContent: 'Spotlight Content'
        };
        return labels[type] || 'Content';
    };
    
    const isAnActionRunningOnSelected = Array.from(selectedExpertIds).some(id => updatingExpertIds.has(id));

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Community Guidelines AI Scan</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Scanning all expert-generated content for potential violations.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        {selectedExpertIds.size > 0 && (
                            <button
                                onClick={handleEraseSelected}
                                disabled={isErasing || isAnActionRunningOnSelected}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-red-300 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-5 h-5" />
                                {isErasing ? 'Erasing...' : `Erase Selected (${selectedExpertIds.size})`}
                            </button>
                        )}
                        <button
                            onClick={handleScan}
                            disabled={isScanLoading}
                            className="flex-shrink-0 flex items-center gap-2 py-2 px-5 rounded-lg border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isScanLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Re-scanning...
                                </>
                            ) : (
                                <>
                                    <ShieldExclamationIcon className="w-5 h-5" />
                                    Re-run Scan
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {error && (
                     <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {isScanLoading && (
                     <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 font-semibold animate-pulse">AI is currently scanning all content...</p>
                    </div>
                )}

                {scanPerformed && !isScanLoading && alerts.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-green-300 bg-green-50 rounded-lg">
                        <ShieldCheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800">No Issues Found</h3>
                        <p className="text-green-600">All scanned content appears to be in line with community guidelines.</p>
                    </div>
                )}

                {scanPerformed && !isScanLoading && alerts.length > 0 && (
                    <div className="space-y-4">
                         <p className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md border border-yellow-200">
                            <strong>{alerts.length} potential issue(s) found.</strong> Manual review and action are recommended.
                        </p>
                        {alerts.map((alert, index) => {
                             const expert = experts.find(e => e.id === alert.expertId);
                             if (!expert) return null;

                             const isUpdating = updatingExpertIds.has(expert.id);
                             const isCurrentUser = expert.id === currentUser?.id;

                            return (
                                <div key={index} className={`rounded-lg p-4 transition-colors ${selectedExpertIds.has(expert.id) ? 'bg-customBlue-100/50' : 'bg-red-50/50 border border-red-200'}`}>
                                    <div className="flex items-start gap-4">
                                         <input 
                                            type="checkbox" 
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-customBlue-600 focus:ring-customBlue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            checked={selectedExpertIds.has(expert.id)}
                                            onChange={() => handleToggleSelection(expert.id)}
                                            aria-label={`Select ${expert.name}`}
                                            disabled={isCurrentUser}
                                            title={isCurrentUser ? "You cannot select your own account for bulk actions." : ""}
                                        />
                                        <div className="flex-grow">
                                            <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                                                <div>
                                                    <span className="font-bold text-red-800">{alert.expertName}</span>
                                                    <p className="text-xs text-gray-500">{expert.email}</p>
                                                </div>
                                                <span className="px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
                                                    {getContentTypeLabel(alert.contentType)}
                                                </span>
                                            </div>
                                            <div className="mt-2 p-3 bg-white border rounded-md">
                                                <p className="text-sm text-gray-500 font-semibold">Flagged Content:</p>
                                                <blockquote className="text-gray-700 italic border-l-2 border-red-300 pl-2 mt-1">"{alert.flaggedContent}"</blockquote>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-sm text-red-700 font-semibold">Reason for Flag:</p>
                                                <p className="text-sm text-red-600">{alert.reason}</p>
                                            </div>
                                        </div>
                                         <div 
                                            className="flex-shrink-0" 
                                            title={isCurrentUser ? "You cannot modify your own account." : ""}
                                        >
                                            <label htmlFor={`toggle-alert-${expert.id}`} className={`flex flex-col items-center gap-1 ${isUpdating || isCurrentUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <span className="text-xs font-semibold text-gray-600">{expert.status === UserStatus.ACTIVE ? 'Enabled' : 'Disabled'}</span>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        id={`toggle-alert-${expert.id}`}
                                                        className="sr-only peer"
                                                        checked={expert.status === UserStatus.ACTIVE}
                                                        onChange={() => handleStatusToggle(expert.id, expert.name, expert.status)}
                                                        disabled={isUpdating || isCurrentUser}
                                                    />
                                                    <div className={`block bg-gray-200 w-12 h-7 rounded-full transition-colors peer-checked:bg-green-400 ${isUpdating || isCurrentUser ? 'opacity-50 grayscale' : ''}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full ${isUpdating || isCurrentUser ? 'opacity-50 grayscale' : ''}`}></div>
                                                </div>
                                            </label>
                                         </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentModeration;