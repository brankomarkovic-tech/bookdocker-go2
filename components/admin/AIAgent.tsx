import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { getAdminInsights } from '../../services/geminiService';
import { SparklesIcon } from '../icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AIAgent: React.FC = () => {
    const { experts } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm your AI Admin Agent. I can analyze platform data to provide insights. Ask me a question or try one of the suggestions below." }
    ]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendQuery = async (prompt?: string) => {
        const currentQuery = (prompt || query).trim();
        if (!currentQuery || isLoading) return;

        setMessages(prev => [...prev, { sender: 'user', text: currentQuery }]);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await getAdminInsights(currentQuery, experts);
            setMessages(prev => [...prev, { sender: 'ai', text: response }]);
        } catch (error) {
            console.error(error);
            const errorMessage = "Sorry, I encountered an error while processing your request. Please check the console for details and try again.";
            setMessages(prev => [...prev, { sender: 'ai', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestionPrompts = [
        "How many experts are on the platform?",
        "List all genres and count the experts in each.",
        "Which expert has sold the most books?",
        "Show me all experts from Japan.",
    ];

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 animate-fade-in">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                        {message.sender === 'ai' && (
                            <div className="w-10 h-10 rounded-full bg-customBlue-600 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className={`p-4 rounded-lg max-w-lg shadow-sm ${message.sender === 'ai' ? 'bg-gray-100 text-gray-800' : 'bg-customBlue-600 text-white'}`}>
                            <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-customBlue-600 flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="p-4 rounded-lg bg-gray-100 text-gray-800 shadow-sm">
                           <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="flex flex-wrap gap-2 mb-4">
                    {suggestionPrompts.map(prompt => (
                        <button
                            key={prompt}
                            onClick={() => handleSendQuery(prompt)}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm bg-customBlue-100 text-customBlue-800 rounded-full hover:bg-customBlue-200 transition-colors disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about experts, books, genres..."
                            className="flex-1 w-full px-4 py-3 border rounded-lg shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-customBlue-600"
                            aria-label="Ask the AI agent a question"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!query.trim() || isLoading}
                            className="py-3 px-6 rounded-lg border border-transparent bg-customBlue-600 text-sm font-medium text-white shadow-sm hover:bg-customBlue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </footer>
        </div>
    );
};

export default AIAgent;
