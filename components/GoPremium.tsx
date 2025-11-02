import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BackIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';
import { FREE_BOOK_LIMIT, PREMIUM_BOOK_LIMIT, FREE_SPOTLIGHT_LIMIT, PREMIUM_SPOTLIGHT_LIMIT } from '../constants';

const GoPremium: React.FC = () => {
    const { navigateToList } = useAppContext();

    const features = [
        {
            feature: 'Book Listing Limit',
            free: `${FREE_BOOK_LIMIT} books`,
            premium: `${PREMIUM_BOOK_LIMIT} books`,
        },
        {
            feature: 'Expert Spotlights',
            free: `${FREE_SPOTLIGHT_LIMIT} post`,
            premium: `${PREMIUM_SPOTLIGHT_LIMIT} posts`,
        },
        {
            feature: 'Create Buzz in Title Hive',
            free: false,
            premium: true,
        },
        {
            feature: 'Title Hive Alert Agent Emails',
            free: false,
            premium: true,
        },
        {
            feature: 'Create Special Offers',
            free: false,
            premium: true,
        },
        {
            feature: 'Set "On Leave" Status',
            free: false,
            premium: true,
        },
    ];

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="mb-8">
                    <button
                        onClick={navigateToList}
                        className="flex items-center text-customBlue-600 hover:text-customBlue-800 font-semibold"
                        aria-label="Back to all experts"
                    >
                        <BackIcon className="w-5 h-5 mr-2" />
                        Back to Homepage
                    </button>
                </div>

                <header className="text-center mb-12">
                    <SparklesIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Unlock Your Full Potential</h1>
                    <p className="mt-4 text-lg text-gray-600">
                        Upgrade to the Premium Toolkit to access powerful features designed for the dedicated expert collector.
                    </p>
                </header>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        {/* Free Tier */}
                        <div className="p-8 border-b md:border-b-0 md:border-r">
                            <h2 className="text-2xl font-bold text-gray-800">Free</h2>
                            <p className="mt-2 text-gray-500">The essentials to get you started on the platform.</p>
                            <p className="mt-6 text-4xl font-extrabold text-gray-900">
                                $0<span className="text-lg font-medium text-gray-500">/month</span>
                            </p>
                            <button className="mt-6 w-full py-3 px-6 text-center rounded-lg bg-gray-200 text-gray-800 font-semibold cursor-default">
                                Your Current Plan
                            </button>
                        </div>

                        {/* Premium Tier */}
                        <div className="p-8 md:col-span-2 bg-customBlue-600 text-white">
                            <h2 className="text-2xl font-bold">Premium</h2>
                            <p className="mt-2 text-customBlue-100">Maximize your reach and collection management.</p>
                            <p className="mt-6 text-4xl font-extrabold">
                                $10<span className="text-lg font-medium text-customBlue-100">/month</span>
                            </p>
                            <p className="text-sm text-customBlue-100">(Billed annually at $120)</p>
                            <button
                                className="mt-6 w-full py-3 px-6 text-center rounded-lg bg-white text-customBlue-700 font-bold hover:bg-customBlue-50 transition-transform transform hover:scale-105"
                                title="Payment integration coming soon!"
                                disabled
                            >
                                Upgrade to Premium
                            </button>
                        </div>
                    </div>

                    {/* Features Table */}
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Feature Comparison</h3>
                        <div className="space-y-5">
                            {features.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-4">
                                    <p className="font-semibold text-gray-700">{item.feature}</p>
                                    {/* Free */}
                                    <div className="text-center">
                                        {typeof item.free === 'boolean' ? (
                                            item.free ? <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto" /> : <XCircleIcon className="w-6 h-6 text-gray-400 mx-auto" />
                                        ) : (
                                            <span className="text-gray-800">{item.free}</span>
                                        )}
                                    </div>
                                    {/* Premium */}
                                    <div className="text-center font-bold">
                                         {typeof item.premium === 'boolean' ? (
                                            item.premium ? <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto" /> : <XCircleIcon className="w-6 h-6 text-gray-400 mx-auto" />
                                        ) : (
                                            <span className="text-customBlue-700">{item.premium}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoPremium;