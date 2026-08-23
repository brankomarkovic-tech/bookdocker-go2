import { GoogleGenAI, Type } from "@google/genai";

// Ensure process.env.API_KEY is available.
// In a Vite environment, this is typically handled by `define` in `vite.config.ts`
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn("Gemini API key is not set. AI features may not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
  };
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
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }

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

export const scanBookCover = async (imageFile: File): Promise<{ title?: string; author?: string }> => {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            imagePart,
            "Identify the book title and author from this cover image. Respond with a JSON object containing 'title' and 'author' keys. If you cannot find one of the fields, omit it from the JSON. Do not include any markdown formatting like ```json, just the raw JSON string."
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'The title of the book.',
                    },
                    author: {
                        type: Type.STRING,
                        description: 'The author of the book.',
                    },
                },
            },
        },
    });

    try {
        const text = response.text.trim();
        const data = JSON.parse(text);
        return data;
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", response.text, e);
        return {};
    }
};

export const generateBio = async (name: string, genre: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }
    const prompt = `Write a short, engaging, and professional bio (2-3 sentences) for a book expert named ${name} specializing in the ${genre} genre. The bio should make them sound knowledgeable and passionate, suitable for a profile on a platform for book collectors.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};
