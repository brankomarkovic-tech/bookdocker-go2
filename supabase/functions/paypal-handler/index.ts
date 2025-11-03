// supabase/functions/paypal-handler/index.ts
// IMPORTANT: This function relies on several Supabase secrets that must be set in the project dashboard:
// - PAYPAL_CLIENT_ID: Your PayPal application's client ID.
// - PAYPAL_CLIENT_SECRET: Your PayPal application's client secret.
// - PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com' for testing, 'https://api-m.paypal.com' for production.
// - SUPABASE_URL: Your project's Supabase URL.
// - SUPABASE_SERVICE_ROLE_KEY: Your project's service role key for admin-level database access.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Expert } from '../../../types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- PAYPAL API HELPERS ---
const getPayPalAccessToken = async () => {
    // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
    const clientId = (globalThis.Deno as any).env.get('PAYPAL_CLIENT_ID');
    // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
    const clientSecret = (globalThis.Deno as any).env.get('PAYPAL_CLIENT_SECRET');
    // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
    const apiBase = (globalThis.Deno as any).env.get('PAYPAL_API_BASE');

    if (!clientId || !clientSecret || !apiBase) {
        throw new Error("PayPal environment variables are not set.");
    }

    const auth = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("PayPal Auth Error:", errorBody);
        throw new Error('Failed to get PayPal access token.');
    }
    const data = await response.json();
    return data.access_token;
};

// --- MAIN SERVER LOGIC ---
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { type, orderId } = payload;
        
        // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
        const apiBase = (globalThis.Deno as any).env.get('PAYPAL_API_BASE');
        if (!apiBase) {
          throw new Error("PayPal API base URL is not set.");
        }

        switch (type) {
            case 'create-order': {
                const accessToken = await getPayPalAccessToken();
                const url = `${apiBase}/v2/checkout/orders`;
                const orderPayload = {
                    intent: 'CAPTURE',
                    purchase_units: [{
                        amount: {
                            currency_code: 'USD',
                            value: '120.00', // Annual subscription price
                        },
                        description: 'BookDocker GO2 Premium Annual Subscription',
                    }],
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(orderPayload),
                });
                
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error("PayPal Order Creation Error:", errorBody);
                    throw new Error('Failed to create PayPal order.');
                }
                
                const data = await response.json();
                return new Response(JSON.stringify({ orderId: data.id }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            case 'capture-order': {
                 if (!orderId) {
                    throw new Error("Order ID is required to capture payment.");
                }

                // Authenticate the user making the request
                const supabaseClient = createClient(
                    // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
                    (globalThis.Deno as any).env.get('SUPABASE_URL')!,
                    // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
                    (globalThis.Deno as any).env.get('SUPABASE_ANON_KEY')!,
                    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
                );
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user || !user.email) {
                    throw new Error("User not authenticated or email is missing.");
                }

                const accessToken = await getPayPalAccessToken();
                const url = `${apiBase}/v2/checkout/orders/${orderId}/capture`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error("PayPal Capture Error:", errorBody);
                    throw new Error('Failed to capture PayPal payment.');
                }
                
                const captureData = await response.json();
                
                if (captureData.status === 'COMPLETED') {
                    // Payment successful, update user's subscription in the database
                    const supabaseAdmin = createClient(
                        // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
                        (globalThis.Deno as any).env.get('SUPABASE_URL')!,
                        // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
                        (globalThis.Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY')!
                    );

                    const { data: updatedExpert, error: updateError } = await supabaseAdmin
                        .from('experts')
                        .update({ subscription_tier: 'premium' })
                        .eq('email', user.email) // FIX: Use email to find the user, not ID.
                        .select()
                        .single();

                    if (updateError) {
                        console.error('Database update error after payment:', updateError);
                        throw new Error('Payment was successful, but failed to update your account. Please contact support.');
                    }

                    return new Response(JSON.stringify({ success: true, updatedExpert }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    });
                } else {
                    throw new Error(`Payment not completed. Status: ${captureData.status}`);
                }
            }

            default:
                throw new Error(`Invalid handler type: ${type}`);
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});