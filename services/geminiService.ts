import { BookGenre, Expert, ModerationAlert } from '../types';

// TODO: All Gemini functions require a secret API key and must be moved to a secure backend function.
// They are temporarily disabled on the client-side to allow the app to deploy.

const disabledFeatureMessage = 'This AI feature is temporarily disabled for security reasons and will be enabled in a future update.';

export const generateBio = async (name: string, genre: BookGenre): Promise<string> => {
  console.error("generateBio is disabled on the client.");
  alert(disabledFeatureMessage);
  return `Bio for ${name}, an expert in ${genre}.`;
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

export const getAdminInsights = async (query: string, experts: Expert[]): Promise<string> => {
    console.error("getAdminInsights is disabled on the client.");
    alert(disabledFeatureMessage);
    return "AI insights are temporarily unavailable.";
};

export const scanContentForIssues = async (experts: Expert[]): Promise<ModerationAlert[]> => {
    console.error("scanContentForIssues is disabled on the client.");
    alert(disabledFeatureMessage);
    return [];
};
