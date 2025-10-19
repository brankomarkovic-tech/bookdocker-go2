import { BookGenre, Expert, ModerationAlert } from '../types';
import { invokeGeminiAdminAgent } from './apiService';


// The client-side bio generation is permanently disabled for security.
// All Gemini API calls must go through a secure backend function.
const disabledFeatureMessage = 'This specific AI feature is disabled on the client for security. Other admin AI features are available.';

export const generateBio = async (name: string, genre: BookGenre): Promise<string> => {
  console.error("generateBio is permanently disabled on the client.");
  alert(disabledFeatureMessage);
  // Return a non-AI-generated string as a fallback.
  return `As an expert in ${genre}, I, ${name}, have curated a collection of rare and interesting books. My passion for ${genre.toLowerCase()} drives me to find unique editions and share them with fellow enthusiasts. I believe every book has a story, not just in its pages, but in its history as an object. I look forward to connecting with other book lovers on this platform.`;
};


export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(file.type));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const scanContentForIssues = async (experts: Expert[]): Promise<ModerationAlert[]> => {
    try {
        const data = await invokeGeminiAdminAgent({
            type: 'scanContentForIssues',
            experts
        });
        return data.alerts;
    } catch (error) {
        console.error("Error scanning content:", error);
        throw error; // Re-throw to be handled by the component
    }
};

// FIX: Add missing getAdminInsights function to provide data for the AI Agent component.
export const getAdminInsights = async (query: string, experts: Expert[]): Promise<string> => {
    try {
        const data = await invokeGeminiAdminAgent({
            type: 'getAdminInsights',
            query,
            experts,
        });
        // Assuming the backend returns an object with an 'insight' property
        if (data && typeof data.insight === 'string') {
            return data.insight;
        }
        throw new Error('Received an invalid response from the AI agent.');
    } catch (error) {
        console.error("Error getting admin insights:", error);
        throw error; // Re-throw to be handled by the component
    }
};
