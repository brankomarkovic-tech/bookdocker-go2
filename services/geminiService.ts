import { GoogleGenAI } from "@google/genai";
import { BookGenre, Expert, ModerationAlert } from "../types";

// Assume process.env.API_KEY is available and configured in the environment.
// Do not ask the user for it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates a bio for an expert using the Gemini API.
 */
export const generateBio = async (name: string, genre: BookGenre): Promise<string> => {
    const prompt = `Generate a compelling, professional, and short (2-3 sentences) biography for a book expert named ${name}. Their specialty is ${genre}. The tone should be engaging and welcoming, highlighting their passion and expertise. Do not use markdown or quotes.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating bio with Gemini:", error);
        throw new Error("Failed to generate biography.");
    }
};

/**
 * Resizes an image file to fit within max dimensions while maintaining aspect ratio.
 * @returns A promise that resolves with a base64 data URL of the resized image.
 */
export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
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
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(file.type));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Gets admin-level insights by analyzing expert data with Gemini.
 */
export const getAdminInsights = async (query: string, experts: Expert[]): Promise<string> => {
    const simplifiedExperts = experts.map(e => ({
        id: e.id,
        name: e.name,
        genre: e.genre,
        country: e.country,
        subscriptionTier: e.subscriptionTier,
        status: e.status,
        bookCount: e.books?.length || 0,
        booksSold: e.books?.filter(b => b.status === 'Sold').length || 0,
    }));

    const dataContext = JSON.stringify(simplifiedExperts, null, 2);

    const prompt = `You are an AI administrative assistant for the BookDocker GO2 platform.
Analyze the following platform data and answer the user's query.
Provide concise, clear, and data-driven answers. Do not make up information.
If the data is insufficient to answer, state that.

Platform Data (JSON format):
${dataContext}

User Query: "${query}"

Your Answer:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using pro for more complex reasoning
            contents: prompt,
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error getting admin insights from Gemini:", error);
        throw new Error("Failed to get insights from AI agent.");
    }
};

/**
 * Scans all user-generated content for community guideline violations.
 * @returns A promise that resolves with an array of ModerationAlerts.
 */
export const scanContentForIssues = async (experts: Expert[]): Promise<ModerationAlert[]> => {
    const contentToScan: { expertId: string, expertName: string, contentType: 'bio' | 'blogPostTitle' | 'blogPostContent', content: string }[] = [];

    experts.forEach(expert => {
        if (expert.bio) {
            contentToScan.push({ expertId: expert.id, expertName: expert.name, contentType: 'bio', content: expert.bio });
        }
        (expert.spotlights || []).forEach(spotlight => {
            if (spotlight.title) {
                contentToScan.push({ expertId: expert.id, expertName: expert.name, contentType: 'blogPostTitle', content: spotlight.title });
            }
            if (spotlight.content) {
                contentToScan.push({ expertId: expert.id, expertName: expert.name, contentType: 'blogPostContent', content: spotlight.content });
            }
        });
    });

    if (contentToScan.length === 0) {
        return [];
    }

    const prompt = `You are a content moderation AI for the BookDocker GO2 platform. Your task is to review user-generated content for violations of the community guidelines. The primary rule is: "Be Respectful. Be Kind." You must flag any content that contains hate speech, harassment, or discriminatory language based on race, color, ethnic origin, religion, political affiliation, sexual orientation, gender identity, minority status, nationality, or disability.

Analyze the following JSON array of content. For each item that violates the guidelines, create an entry in a result array. If an item is clean, ignore it.

Respond ONLY with a valid JSON array of flagged items. The array can be empty if no issues are found.
Each object in the result array must have this exact structure:
{
  "expertId": "the_expert_id",
  "expertName": "The Expert Name",
  "contentType": "the_content_type",
  "flaggedContent": "The exact content that was flagged",
  "reason": "A brief, clear explanation of why the content was flagged (e.g., 'Contains discriminatory language towards a specific group.')."
}

Content to analyze:
${JSON.stringify(contentToScan)}

Result:
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const resultText = response.text.trim();
        // Handle cases where the model might return an empty string for no violations
        if (!resultText) {
            return [];
        }
        const alerts: ModerationAlert[] = JSON.parse(resultText);
        return alerts;
    } catch (error) {
        console.error("Error scanning content with Gemini:", error);
        if (error instanceof SyntaxError) {
             console.error("Gemini did not return valid JSON for moderation scan.");
        }
        throw new Error("Failed to scan content for moderation issues.");
    }
};
