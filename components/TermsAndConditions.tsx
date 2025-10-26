import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BackIcon, DocumentTextIcon } from './icons';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b pb-2">{title}</h2>
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {children}
        </div>
    </div>
);

const TermsAndConditions: React.FC = () => {
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
                    <DocumentTextIcon className="w-16 h-16 mx-auto text-customBlue-600 mb-4" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Terms and Conditions</h1>
                    <p className="mt-2 text-lg text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                </header>

                <Section title="1. Introduction">
                    <p>
                        Welcome to BookDocker GO2 ("the Platform"). These Terms and Conditions govern your use of our website and services. By accessing or using the Platform, you agree to be bound by these terms. The Platform acts as a meeting point for book enthusiasts and expert collectors ("GO2 Experts") to showcase and sell used books.
                    </p>
                </Section>

                <Section title="2. Role of the Platform">
                    <p>
                        BookDocker GO2 is a facilitator and is not a party to any transaction between users. All agreements, sales, payments, and shipping arrangements are handled directly between the buyer and the GO2 Expert. We are not responsible for, and do not guarantee, the quality, condition, legality, or safety of items listed, the accuracy of listings, or the ability of sellers to sell or buyers to pay.
                    </p>
                </Section>

                <Section title="3. User Accounts and Conduct">
                    <p>
                        To become a GO2 Expert, you must create an account and provide accurate information. You are responsible for maintaining the confidentiality of your account and for all activities that occur under it. You agree to adhere to our Community Guidelines, which require all users to be respectful and kind. We have a zero-tolerance policy for hate speech, harassment, or any form of discriminatory content. We reserve the right to suspend or terminate accounts that violate these terms.
                    </p>
                </Section>

                <Section title="4. User-Generated Content">
                    <p>
                        You retain ownership of the content you post on the Platform, including your bio, book listings, and Spotlights. By posting content, you grant BookDocker GO2 a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the Platform's services. You are solely responsible for the content you post and warrant that it does not infringe on any third-party rights.
                    </p>
                </Section>

                <Section title="5. Use of AI Features">
                    <p>
                        The Platform may utilize artificial intelligence services, such as Google's Gemini API, to provide features like AI-powered bio generation or content moderation. While we strive for accuracy, the output from these AI features is provided for convenience and should be reviewed by you. BookDocker GO2 is not liable for any inaccuracies or issues arising from AI-generated content.
                    </p>
                </Section>

                <Section title="6. Disclaimers and Limitation of Liability">
                    <p>
                        The Platform is provided on an "as is" and "as available" basis without any warranties, express or implied. BookDocker GO2, its owners, and affiliates will not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of the Platform or from any transactions between users. Your sole remedy for dissatisfaction with the Platform is to stop using it.
                    </p>
                </Section>

                <Section title="7. Changes to Terms">
                    <p>
                        We reserve the right to modify these Terms and Conditions at any time. We will notify users of any significant changes. Your continued use of the Platform after such changes constitutes your acceptance of the new terms.
                    </p>
                </Section>

                <Section title="8. Governing Law">
                    <p>
                        These Terms and Conditions shall be governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
                    </p>
                </Section>

            </div>
        </div>
    );
};

export default TermsAndConditions;