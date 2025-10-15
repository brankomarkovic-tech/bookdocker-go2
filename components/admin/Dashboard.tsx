import React, { useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { BookStatus, SubscriptionTier, UserRole } from '../../types';
import { BookIcon, MapPinIcon, SparklesIcon } from '../icons';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-6 border border-gray-200">
        <div className="bg-customBlue-100 p-4 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { experts } = useAppContext();

    const stats = useMemo(() => {
        // IMPORTANT: Filter out dummy users to ensure stats only reflect real, manageable database users.
        const platformExperts = experts.filter(e => e.role === UserRole.EXPERT && !e.id.startsWith('premium-user-'));
        const totalExperts = platformExperts.length;
        const premiumExperts = platformExperts.filter(e => e.subscriptionTier === SubscriptionTier.PREMIUM).length;
        
        const allBooks = platformExperts.flatMap(e => e.books || []);
        const soldBooks = allBooks.filter(b => b.status === BookStatus.SOLD).length;
        const availableBooks = allBooks.filter(b => b.status === BookStatus.AVAILABLE).length;
        
        const genreCounts = platformExperts.reduce<Record<string, number>>((acc, expert) => {
            if (expert.genre) {
                acc[expert.genre] = (acc[expert.genre] || 0) + 1;
            }
            return acc;
        }, {});

        const genreDistribution = Object.entries(genreCounts).sort(
            (a: [string, number], b: [string, number]) => b[1] - a[1]
        );

        return { totalExperts, premiumExperts, soldBooks, availableBooks, genreDistribution };
    }, [experts]);
    
    // The main `experts` list is already sorted newest-first. We just need to filter out dummy users.
    const recentExperts = useMemo(() => {
        return experts
            .filter(e => e.role === UserRole.EXPERT && !e.id.startsWith('premium-user-'))
            .slice(0, 5);
    }, [experts]);

    return (
        <div className="space-y-8 animate-fade-in">
            <section aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="sr-only">Platform Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Experts" value={stats.totalExperts} icon={<BookIcon className="w-8 h-8 text-customBlue-600" />} />
                    <StatCard title="Premium Experts" value={stats.premiumExperts} icon={<SparklesIcon className="w-8 h-8 text-yellow-500" />} />
                    <StatCard title="Books Available" value={stats.availableBooks} icon={<BookIcon className="w-8 h-8 text-green-600" />} />
                    <StatCard title="Books Sold" value={stats.soldBooks} icon={<BookIcon className="w-8 h-8 text-red-600" />} />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section aria-labelledby="recent-experts-heading" className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 id="recent-experts-heading" className="text-xl font-bold text-gray-800 mb-4">
                        Recently Joined Experts
                    </h2>
                    {recentExperts.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {recentExperts.map(expert => (
                                <li key={expert.id} className="py-4 flex items-center gap-4">
                                    <img src={expert.avatarUrl} alt={expert.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{expert.name}</p>
                                        <p className="text-sm text-gray-500">{expert.genre}</p>
                                    </div>
                                    {expert.country && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPinIcon className="w-4 h-4 mr-1.5" />
                                            <span>{expert.country}</span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 py-8 text-center">No experts have joined yet.</p>
                    )}
                </section>

                <section aria-labelledby="genre-distribution-heading" className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 id="genre-distribution-heading" className="text-xl font-bold text-gray-800 mb-4">
                        Expertise Distribution
                    </h2>
                     {stats.genreDistribution.length > 0 ? (
                        <ul className="space-y-4">
                            {stats.genreDistribution.map(([genre, count]) => (
                                <li key={genre}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">{genre}</span>
                                        <span className="text-sm font-semibold text-customBlue-700">{count} Expert(s)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-customBlue-600 h-2.5 rounded-full" 
                                            style={{ width: `${stats.totalExperts > 0 ? (count / stats.totalExperts) * 100 : 0}%` }}
                                            aria-label={`${stats.totalExperts > 0 ? Math.round((count / stats.totalExperts) * 100) : 0}% of experts`}
                                        ></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-gray-500 py-8 text-center">No genre data available.</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Dashboard;