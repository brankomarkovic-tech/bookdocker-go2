import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BackIcon, UserIcon } from './icons';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b pb-2">{title}</h2>
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {children}
        </div>
    </div>
);

const PrivacyPolicy: React.FC = () => {
    const { navigateToList } = useAppContext();

    return (
        <div className="bg-white py-8 md:py-12">
            <div className="container mx-auto px-6 max-w-4xl">
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
                <header className="text-center mb-10">
                    <UserIcon className="w-16 h-16 mx-auto text-customBlue-600 mb-4" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Privacy Policy</h1>
                    <p className="mt-2 text-lg text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                </header>
                
                <Section title="1. Introduction">
                    <p>
                        BookDocker GO2 ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                    </p>
                </Section>
                
                <Section title="2. Information We Collect">
                    <p>We may collect information about you in a variety of ways. The information we may collect on the Platform includes:</p>
                    <ul>
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, country, and any other information you voluntarily provide, like your bio, social media links, and avatar image.</li>
                        <li><strong>User-Generated Content:</strong> All content you create and upload, including book listings, Spotlight posts, audio recordings, and book queries.</li>
                        <li><strong>Communication Data:</strong> When you contact another user or provide feedback, we process the necessary information (like your email address and the content of the message) to facilitate that communication.</li>
                    </ul>
                </Section>

                <Section title="3. How We Use Your Information">
                    <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Platform to:</p>
                    <ul>
                        <li>Create and manage your account.</li>
                        <li>Display your profile and listings to other users.</li>
                        <li>Facilitate communication between users (e.g., book inquiries).</li>
                        <li>Operate AI-powered features, which involves sending relevant content to our AI service providers for processing.</li>
                        <li>Monitor and analyze usage and trends to improve your experience with the Platform.</li>
                        <li>Perform content moderation to ensure compliance with our Community Guidelines.</li>
                    </ul>
                </Section>

                <Section title="4. Third-Party Services">
                    <p>We use third-party services to operate our platform:</p>
                    <ul>
                        <li><strong>Supabase:</strong> Our platform is built on Supabase, which provides our database, authentication, and serverless functions. Your data is stored and managed within the Supabase infrastructure. You can view Supabase's privacy policy for more information.</li>
                        <li><strong>Google Gemini API:</strong> For features like AI bio generation and content moderation, we send relevant text content to the Google Gemini API for processing. We do not send personal identification information like your email address unless it is part of the content being analyzed.</li>
                        <li><strong>Resend:</strong> Email communications (such as inquiries and login codes) are sent via the Resend API.</li>
                    </ul>
                </Section>
                
                <Section title="5. Data Security">
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. These measures are primarily provided by our infrastructure partner, Supabase, which employs industry-standard security practices. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
                    </p>
                </Section>

                <Section title="6. Your Rights and Choices">
                    <p>You have certain rights regarding your personal information:</p>
                    <ul>
                        <li><strong>Access and Update:</strong> You may review or change the information in your account at any time by logging in and using the "Edit Profile" feature.</li>
                        <li><strong>Deletion:</strong> You may request to delete your account and personal information by contacting the platform administrator. Please note that we may need to retain certain information for record-keeping purposes or to comply with legal obligations.</li>
                    </ul>
                </Section>
                
                <Section title="7. Changes to This Policy">
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of our practices.
                    </p>
                </Section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;