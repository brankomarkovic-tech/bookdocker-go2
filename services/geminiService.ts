import { GoogleGenAI, Type } from "@google/genai";
import { BookGenre, Expert, ModerationAlert } from '../types';

// FIX: Initialized the Google AI client. The environment variable is assumed to be configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates an expert bio using the Gemini API.
 */
export const generateBio = async (name: string, genre: BookGenre): Promise<string> => {
  const prompt = `Write a compelling and professional bio for a book expert named ${name}. 
  Their specialized genre is ${genre}. 
  The bio should be engaging, around 50-70 words, and highlight their passion and deep knowledge in the genre.
  Write it in the third person. For example, "is an expert in..." or "Their collection focuses on...".`;

  try {
    // FIX: Used ai.models.generateContent to generate text.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // FIX: Accessed the .text property directly for the response.
    return response.text.trim();
  } catch (error) {
    console.error('Error generating bio with Gemini API:', error);
    throw new Error('Failed to generate bio. Please try again.');
  }
};

/**
 * Resizes an image file to the specified dimensions and returns a base64 data URL.
 * This function does not use the Gemini API.
 */
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
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(file.type));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Generates admin insights based on platform data using the Gemini API.
 */
export const getAdminInsights = async (query: string, experts: Expert[]): Promise<string> => {
    // We only need a subset of data to answer questions, to avoid sending too much data.
    const simplifiedExperts = experts.map(e => ({
        id: e.id,
        name: e.name,
        genre: e.genre,
        country: e.country,
        status: e.status,
        subscriptionTier: e.subscriptionTier,
        bookCount: e.books.length,
        soldBooks: e.books.filter(b => b.status === 'Sold').length,
        createdAt: e.createdAt,
    }));

    const prompt = `
You are an AI admin assistant for a platform called BookDocker GO2, which connects book experts with buyers.
Analyze the following platform data and answer the user's query.
The data is provided as an array of JSON objects, where each object represents a book expert.

Data:
${JSON.stringify(simplifiedExperts, null, 2)}

User Query:
"${query}"

Provide a clear, concise, and helpful answer based *only* on the provided data. Do not make up information.
If the data is insufficient to answer the query, state that you don't have enough information.
Format your answer in a readable way, using markdown if appropriate (e.g., lists).
`;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro', // Using pro for more complex analysis
          contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error('Error getting admin insights with Gemini API:', error);
        throw new Error('Failed to get insights. Please try again.');
    }
};

/**
 * Scans expert content for potential community guideline violations using the Gemini API.
 */
export const scanContentForIssues = async (experts: Expert[]): Promise<ModerationAlert[]> => {
    // Filter for experts with content to scan
    const expertsWithContent = experts
      .filter(e => !e.isExample && (e.bio || (e.spotlights && e.spotlights.length > 0)))
      .map(e => ({
        expertId: e.id,
        expertName: e.name,
        bio: e.bio,
        spotlights: e.spotlights?.map(s => ({
            title: s.title,
            content: s.content,
        })) || [],
    }));
    
    if (expertsWithContent.length === 0) {
        return [];
    }
    
    const prompt = `
You are a content moderation AI for BookDocker GO2. Your task is to scan user-generated content for violations of our community guidelines.

**Community Guidelines:**
We have a zero-tolerance policy for hate speech, harassment, or discriminatory content. This includes any offensive speech or writing based on:
- Race, color, or ethnic origin
- Religion or personal beliefs
- Political affiliation
- Sexual orientation, gender identity, or expression
- Minority status, nationality, or disability
Any content that is abusive, threatening, or promotes hostility will be flagged.

**Task:**
Analyze the following JSON data containing expert profiles. For each expert, check their 'bio' and each 'spotlight' (title and content).
If you find a potential violation, create an alert object. If there are no violations for an expert, do not include them in the output.
Only return content that is a clear violation. Be strict and avoid flagging borderline or subjective content.

**Input Data:**
${JSON.stringify(expertsWithContent, null, 2)}

**Your output MUST be a valid JSON array of alert objects, matching the provided schema. Do not include any other text or explanations.**
`;

    try {
        // FIX: Used Gemini API with JSON response mode for structured output.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            expertId: { type: Type.STRING },
                            expertName: { type: Type.STRING },
                            contentType: {
                                type: Type.STRING,
                                enum: ['bio', 'blogPostTitle', 'blogPostContent'],
                                description: "The type of content flagged: 'bio', 'blogPostTitle', or 'blogPostContent'",
                            },
                            flaggedContent: {
                                type: Type.STRING,
                                description: "The exact text that was flagged.",
                            },
                            reason: {
                                type: Type.STRING,
                                description: "A brief, clear explanation of why the content was flagged, referencing the specific guideline violated.",
                            },
                        },
                        required: ['expertId', 'expertName', 'contentType', 'flaggedContent', 'reason'],
                    },
                },
            }
        });

        const jsonString = response.text.trim();
        const results: ModerationAlert[] = JSON.parse(jsonString);
        return results;

    } catch (error) {
        console.error('Error scanning content with Gemini API:', error);
        if (error instanceof SyntaxError) {
             throw new Error('Failed to parse moderation results from the AI. The response was not valid JSON.');
        }
        throw new Error('An error occurred during the content moderation scan. Please try again.');
    }
};
