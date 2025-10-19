// supabase/functions/gemini-admin-agent/index.ts
// IMPORTANT: This function relies on a Supabase secret named GEMINI_API_KEY.
// The platform owner must set this in their Supabase project dashboard.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai";
import { Expert, ModerationAlert } from '../../../types.ts';

// --- MAIN HANDLER ---

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload = await req.json();
    const geminiApiKey = (globalThis.Deno as any).env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set in Supabase secrets.');
      throw new Error('AI service is not configured. Missing API key.');
    }
    
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    let responseData;

    switch (payload.type) {
      case 'getAdminInsights':
        responseData = await handleGetAdminInsights(ai, payload.query, payload.experts);
        break;
      
      case 'scanContentForIssues':
        responseData = await handleScanContentForIssues(ai, payload.experts);
        break;

      default:
        throw new Error('Invalid AI agent action specified.');
    }

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (err) {
    console.error(`Error in gemini-admin-agent: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});

// --- ACTION HANDLERS ---

async function handleGetAdminInsights(ai: GoogleGenAI, query: string, experts: Expert[]): Promise<{ response: string }> {
    if (!query || !experts) {
        throw new Error("Query and experts data are required for insights.");
    }

    const model = 'gemini-2.5-pro';
    const prompt = `You are an expert data analyst for an online marketplace of used book experts. Below is the complete platform data for all experts in JSON format. Analyze this data to answer the user's question. Provide a clear, concise, and helpful response.

### Platform Data:
${JSON.stringify(experts, null, 2)}

### User's Question:
"${query}"
`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return { response: response.text };
}


async function handleScanContentForIssues(ai: GoogleGenAI, experts: Expert[]): Promise<{ alerts: ModerationAlert[] }> {
    if (!experts) {
        throw new Error("Experts data is required for content scan.");
    }

    const model = 'gemini-2.5-flash';
    const alerts: ModerationAlert[] = [];
    
    const guidelinePrompt = `You are a content moderator for a community of book lovers called BookDocker GO2. Your task is to check if text violates the community guidelines. 
The guidelines prohibit any form of hate speech, harassment, or discriminatory content based on race, color, ethnic origin, religion, political affiliation, sexual orientation, gender identity, minority status, or disability. The content must also be family-friendly and not contain abusive or threatening language.

Review the following text and determine if it violates these rules. Respond in JSON format. Your response MUST match this exact schema: {"is_violation": boolean, "reason": "string (A brief explanation of why it's a violation, or 'No violation found' if it is safe.)"}. Only flag clear and explicit violations.`;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        is_violation: { type: Type.BOOLEAN },
        reason: { type: Type.STRING },
      },
      required: ["is_violation", "reason"],
    };


    for (const expert of experts) {
        const contentToScan = [
            { type: 'bio', content: expert.bio, id: expert.id },
            ...(expert.spotlights || []).map(s => ({ type: 'blogPostTitle', content: s.title, id: s.id })),
            ...(expert.spotlights || []).map(s => ({ type: 'blogPostContent', content: s.content, id: s.id })),
        ];

        for (const item of contentToScan) {
            if (!item.content || item.content.trim().length < 10) continue; // Skip empty or very short content

            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: `${guidelinePrompt}\n\n### TEXT TO REVIEW:\n"${item.content}"`,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema,
                    },
                });

                const result = JSON.parse(response.text);

                if (result.is_violation) {
                    alerts.push({
                        expertId: expert.id,
                        expertName: expert.name,
                        contentType: item.type as any,
                        flaggedContent: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
                        reason: result.reason,
                    });
                }
            } catch (e) {
                console.error(`Error scanning content for expert ${expert.id}:`, e.message);
                // Continue scanning other content even if one piece fails
            }
        }
    }

    return { alerts };
}