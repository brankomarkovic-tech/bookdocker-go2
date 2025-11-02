// supabase/functions/gemini-admin-agent/index.ts
// IMPORTANT: This function relies on a Supabase secret named GEMINI_API_KEY.
// The platform owner must set this in their Supabase project dashboard under Project Settings > Edge Functions.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// DEFINITIVE FIX: The URL now points to the correct, modern version of the GenAI library, resolving the "Module not found" error.
import { GoogleGenAI, Type } from 'https://esm.sh/@google/genai@^1.21.0';

// Import shared types from the project root.
import { Expert, ModerationAlert, BookStatus, SubscriptionTier, UserRole } from '../../../types.ts';

/**
 * Handles 'scanContentForIssues' requests.
 * Scans expert content for community guideline violations.
 */
async function handleScanContentForIssues(ai: GoogleGenAI, experts: Expert[]): Promise<{ alerts: ModerationAlert[] }> {
  if (!experts) {
    throw new Error("Experts data is required for content scan.");
  }
  
  const communityGuidelines = `
    - Be Respectful. Be Kind.
    - Zero-tolerance for hate speech, harassment, or discriminatory content.
    - No offensive content based on race, color, ethnic origin, religion, political affiliation, sexual orientation, gender identity, minority status, nationality, or disability.
    - No abusive, threatening, or hostile content.
  `;

  const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isViolation: {
          type: Type.BOOLEAN,
          description: "Is there a violation of the community guidelines?",
        },
        reason: {
          type: Type.STRING,
          description: "If it is a violation, provide a brief, specific reason why based on the guidelines. Otherwise, this should be an empty string.",
        },
      },
      required: ["isViolation", "reason"],
  };

  const allAlerts: ModerationAlert[] = [];

  for (const expert of experts) {
    const contentToScan: { type: 'bio' | 'blogPostTitle' | 'blogPostContent', content: string }[] = [];
    
    if (expert.bio) {
        contentToScan.push({ type: 'bio', content: expert.bio });
    }
    if (expert.spotlights) {
        for (const spotlight of expert.spotlights) {
            if (spotlight.title) {
                contentToScan.push({ type: 'blogPostTitle', content: spotlight.title });
            }
            if (spotlight.content) {
                contentToScan.push({ type: 'blogPostContent', content: spotlight.content });
            }
        }
    }
    
    for (const item of contentToScan) {
      const prompt = `
        Review the following user-generated content based on our community guidelines.
        Determine if it violates any rules and provide a reason if it does.
        Respond with a JSON object that strictly adheres to the provided schema.

        COMMUNITY GUIDELINES:
        ${communityGuidelines}

        CONTENT TO REVIEW:
        "${item.content}"
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema
          }
        });
        
        let result: { isViolation: boolean; reason: string };
        try {
            const cleanedText = response.text.trim();
            result = JSON.parse(cleanedText);
        } catch (parseError) {
            console.warn(`Failed to parse Gemini response for expert ${expert.id}: ${response.text}`, parseError);
            continue;
        }

        if (result.isViolation) {
          allAlerts.push({
            expertId: expert.id,
            expertName: expert.name,
            contentType: item.type,
            flaggedContent: item.content,
            reason: result.reason,
          });
        }
      } catch (e) {
        console.error(`Error scanning content for expert ${expert.id}:`, e);
      }
    }
  }

  return { alerts: allAlerts };
}

/**
 * Handles 'getAdminInsights' requests.
 * Analyzes platform data to answer natural language queries.
 */
async function handleGetAdminInsights(ai: GoogleGenAI, query: string, experts: Expert[]): Promise<{ insight: string }> {
    if (!query) throw new Error("Query is required for insights.");
    if (!experts) throw new Error("Experts data is required for insights.");

    // Pre-process data into a tiny summary to prevent timeouts.
    const platformExperts = experts.filter(e => e.role === UserRole.EXPERT);
    const allBooks = platformExperts.flatMap(e => e.books || []);
    const genreCounts = platformExperts.reduce((acc, e) => {
        acc[e.genre] = (acc[e.genre] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const countryCounts = platformExperts.reduce((acc, e) => {
        if(e.country) {
            acc[e.country] = (acc[e.country] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const platformSummary = {
        totalExperts: platformExperts.length,
        premiumExperts: platformExperts.filter(e => e.subscriptionTier === SubscriptionTier.PREMIUM).length,
        expertsOnLeave: platformExperts.filter(e => e.onLeave).length,
        totalBooks: allBooks.length,
        soldBooks: allBooks.filter(b => b.status === BookStatus.SOLD).length,
        availableBooks: allBooks.filter(b => b.status === BookStatus.AVAILABLE).length,
        genreDistribution: genreCounts,
        countryDistribution: countryCounts,
    };

    const prompt = `
      You are an AI Admin Agent for a platform called BookDocker GO2.
      You will be given a natural language query from an administrator and a pre-calculated JSON summary of the platform's data.
      Your task is to analyze ONLY THIS SUMMARY to provide a concise, accurate answer to the query.
      Do not provide any information that cannot be derived from the provided summary.
      The output should be a single string of plain text.

      QUERY:
      "${query}"

      PLATFORM DATA SUMMARY:
      ${JSON.stringify(platformSummary, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const insight = response.text.trim();
        return { insight };
    } catch (e) {
        console.error(`Error generating insight for query "${query}":`, e);
        throw new Error("The AI agent failed to generate an insight.");
    }
}

// --- MAIN SERVER LOGIC ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const geminiApiKey = (globalThis.Deno as any).env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('AI service is not configured. Missing API key.');
    }
    
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const payload = await req.json();
    const { type, experts, query } = payload;

    let responseData;
    switch (type) {
      case 'scanContentForIssues':
        responseData = await handleScanContentForIssues(ai, experts);
        break;
      case 'getAdminInsights':
        responseData = await handleGetAdminInsights(ai, query, experts);
        break;
      default:
        throw new Error(`Invalid agent action type: ${type}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });
  } catch (err) {
    console.error('Error in gemini-admin-agent:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});