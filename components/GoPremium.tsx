import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BackIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';
import { FREE_BOOK_LIMIT, PREMIUM_BOOK_LIMIT, FREE_SPOTLIGHT_LIMIT, PREMIUM_SPOTLIGHT_LIMIT } from '../constants';
import { SubscriptionTier, Expert } from '../types';
import { invokePayPalHandler } from '../services/apiService';

// FIX: Add type definition for PayPal script on the window object to resolve TypeScript errors.
declare global {
    interface Window {
        paypal: any;
    }
}

// Use a sandbox client ID for testing. Replace with a real one in production.
// This should ideally come from an environment variable.
const PAYPAL_CLIENT_ID = "test"; 

interface PayPalPaymentProps {
    onSuccess: (updatedUser: Expert) => void;
    onError: (error: string) => void;
    onCancel: () => void;
}

const PayPalButtons: React.FC<PayPalPaymentProps> = ({ onSuccess, onError, onCancel }) => {
    const [sdkReady, setSdkReady] = useState(false);
    const paypalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.paypal) {
            setSdkReady(true);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
        script.onload = () => setSdkReady(true);
        script.onerror = () => onError("Failed to load PayPal script. Please check your connection and try again.");
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [onError]);

    useEffect(() => {
        if (sdkReady && paypalRef.current) {
            // Clear any existing buttons
            paypalRef.current.innerHTML = '';
            
            try {
                 window.paypal.Buttons({
                    createOrder: async (data: any, actions: any) => {
                        try {
                            const { orderId } = await invokePayPalHandler({ type: 'create-order' });
                            return orderId;
                        } catch (err) {
                            console.error('Error creating PayPal order:', err);
                            onError(err instanceof Error ? err.message : "Could not initiate payment.");
                            return '';
                        }
                    },
                    onApprove: async (data: any, actions: any) => {
                        try {
                            const { updatedExpert } = await invokePayPalHandler({ type: 'capture-order', orderId: data.orderID });
                            onSuccess(updatedExpert);
                        } catch (err) {
                            console.error('Error capturing PayPal order:', err);
                            onError(err instanceof Error ? err.message : "Payment confirmation failed.");
                        }
                    },
                    onError: (err: any) => {
                        console.error('PayPal button error:', err);
                        onError("An error occurred during the PayPal transaction.");
                    },
                    onCancel: () => {
                        onCancel();
                    }
                }).render(paypalRef.current);
            } catch (err) {
                 console.error('Error rendering PayPal buttons:', err);
                 onError("Could not display PayPal buttons. Please refresh the page.");
            }
        }
    }, [sdkReady, onSuccess, onError, onCancel]);

    if (!sdkReady) {
        return (
            <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-customBlue-600"></div>
                <span className="ml-3 text-gray-600">Loading payment options...</span>
            </div>
        );
    }

    return <div ref={paypalRef} className="w-full flex justify-center"></div>;
};


const GoPremium: React.FC = () => {
    const { navigateToList, currentUser, refreshCurrentUser } = useAppContext();
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error' | 'cancelled'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const isPremium = currentUser?.subscriptionTier === SubscriptionTier.PREMIUM;

    const handleSuccess = (updatedUser: Expert) => {
        refreshCurrentUser(updatedUser);
        setPaymentStatus('success');
        setIsUpgrading(false);
    };

    const handleError = (error: string) => {
        setErrorMessage(error);
        setPaymentStatus('error');
        setIsUpgrading(false);
    };

    const handleCancel = () => {
        setPaymentStatus('cancelled');
        setIsUpgrading(false);
    };

    const features = [
        { feature: 'Book Listing Limit', free: `${FREE_BOOK_LIMIT} books`, premium: `${PREMIUM_BOOK_LIMIT} books` },
        { feature: 'Expert Spotlights', free: `${FREE_SPOTLIGHT_LIMIT} post`, premium: `${PREMIUM_SPOTLIGHT_LIMIT} posts` },
        { feature: 'Create Buzz in Title Hive', free: false, premium: true },
        { feature: 'Title Hive Alert Agent Emails', free: false, premium: true },
        { feature: 'Create Special Offers', free: false, premium: true },
        { feature: 'Set "On Leave" Status', free: false, premium: true },
    ];

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="mb-8">
                    <button onClick={navigateToList} className="flex items-center text-customBlue-600 hover:text-customBlue-800 font-semibold" aria-label="Back to all experts">
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
                        <div className="p-8 border-b md:border-b-0 md:border-r">
                            <h2 className="text-2xl font-bold text-gray-800">Free</h2>
                            <p className="mt-2 text-gray-500">The essentials to get you started on the platform.</p>
                            <p className="mt-6 text-4xl font-extrabold text-gray-900">$0<span className="text-lg font-medium text-gray-500">/month</span></p>
                            <button className="mt-6 w-full py-3 px-6 text-center rounded-lg bg-gray-200 text-gray-800 font-semibold cursor-default" disabled={!isPremium}>
                                Your Current Plan
                            </button>
                        </div>

                        <div className="p-8 md:col-span-2 bg-customBlue-600 text-white">
                            <h2 className="text-2xl font-bold">Premium</h2>
                            <p className="mt-2 text-customBlue-100">Maximize your reach and collection management.</p>
                            <p className="mt-6 text-4xl font-extrabold">$10<span className="text-lg font-medium text-customBlue-100">/month</span></p>
                            <p className="text-sm text-customBlue-100">(Billed annually at $120)</p>
                            <div className="mt-6">
                                {isPremium ? (
                                    <button className="w-full py-3 px-6 text-center rounded-lg bg-white text-customBlue-700 font-bold cursor-default" disabled>
                                        You are a Premium Member
                                    </button>
                                ) : !isUpgrading ? (
                                    <button onClick={() => { setIsUpgrading(true); setPaymentStatus('idle'); }} className="w-full py-3 px-6 text-center rounded-lg bg-white text-customBlue-700 font-bold hover:bg-customBlue-50 transition-transform transform hover:scale-105">
                                        Upgrade to Premium
                                    </button>
                                ) : (
                                    <div className="bg-white p-4 rounded-lg">
                                        {paymentStatus === 'success' ? (
                                            <div className="text-center text-green-700 font-bold">
                                                <p>Success! Welcome to Premium!</p>
                                            </div>
                                        ) : paymentStatus === 'error' ? (
                                            <div className="text-center text-red-700">
                                                <p className="font-bold">Payment Failed</p>
                                                <p className="text-sm">{errorMessage}</p>
                                                <button onClick={() => setIsUpgrading(false)} className="mt-2 text-sm text-customBlue-700 underline">Try Again</button>
                                            </div>
                                        ) : paymentStatus === 'cancelled' ? (
                                             <div className="text-center text-gray-700">
                                                <p>Payment was cancelled.</p>
                                                <button onClick={() => setIsUpgrading(false)} className="mt-2 text-sm text-customBlue-700 underline">Try Again</button>
                                            </div>
                                        ) : (
                                            <PayPalButtons onSuccess={handleSuccess} onError={handleError} onCancel={handleCancel} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Feature Comparison</h3>
                        <div className="space-y-5">
                            {features.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-4">
                                    <p className="font-semibold text-gray-700">{item.feature}</p>
                                    <div className="text-center">
                                        {typeof item.free === 'boolean' ? (item.free ? <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto" /> : <XCircleIcon className="w-6 h-6 text-gray-400 mx-auto" />) : (<span className="text-gray-800">{item.free}</span>)}
                                    </div>
                                    <div className="text-center font-bold">
                                         {typeof item.premium === 'boolean' ? (item.premium ? <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto" /> : <XCircleIcon className="w-6 h-6 text-gray-400 mx-auto" />) : (<span className="text-customBlue-700">{item.premium}</span>)}
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