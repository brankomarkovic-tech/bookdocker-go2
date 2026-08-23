import { BookGenre, Expert, ModerationAlert } from '../types';
import { invokeGeminiAdminAgent } from './apiService';

// The client-side bio generation is permanently disabled for security.
// All Gemini API calls must go through a secure backend function.
const disabledFeatureMessage = 'This specific AI feature is disabled on the client for security. Other admin AI features are available.';

export const generateBio = async (name: string, genre: BookGenre | string): Promise<string> => {
  console.error("generateBio is permanently disabled on the client.");
  // Return a non-AI-generated string as a fallback.
  return `As an expert in ${genre}, I, ${name}, have curated a collection of rare and interesting books. My passion for ${typeof genre === 'string' ? genre.toLowerCase() : genre} drives me to find unique editions and share them with fellow enthusiasts. I believe every book has a story, not just in its pages, but in its history as an object. I look forward to connecting with other book lovers on this platform.`;
};

export const resizeImage = (
    file: File,
    maxWidth: number = 320,
    maxHeight: number = 440,
    quality: number = 0.65
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Scale down keeping aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Minimum dimensions safeguard
                width = Math.max(1, width);
                height = Math.max(1, height);

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));

                // Fill with white background so transparent images don't turn black when converted to JPEG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Always export as lightweight JPEG with compression
                resolve(canvas.toDataURL('image/jpeg', quality));
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
        return data.alerts || [];
    } catch (error) {
        console.error("Error scanning content:", error);
        throw error;
    }
};

export const getAdminInsights = async (query: string, experts: Expert[]): Promise<string> => {
    try {
        const data = await invokeGeminiAdminAgent({
            type: 'getAdminInsights',
            query,
            experts,
        });
        if (data && typeof data.insight === 'string') {
            return data.insight;
        }
        throw new Error('Received an invalid response from the AI agent.');
    } catch (error) {
        console.error("Error getting admin insights:", error);
        throw error;
    }
};
