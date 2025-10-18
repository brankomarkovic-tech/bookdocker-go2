// supabase/functions/send-email/index.ts
// IMPORTANT: This function relies on a Supabase secret named RESEND_API_KEY.
// The platform owner must set this in their Supabase project dashboard under Project Settings > Edge Functions.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Hardcode admin email and production domain for security and professionalism
const ADMIN_EMAIL = 'skljoc.ljubimac@gmail.com';
const PRODUCTION_DOMAIN = 'bookdockergo2.com';
const FROM_ADDRESS = `BookDocker GO2 <noreply@${PRODUCTION_DOMAIN}>`;
const PLATFORM_URL = `https://${PRODUCTION_DOMAIN}`;


// --- EMAIL TEMPLATES ---

const commonStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
  .header { font-size: 24px; font-weight: bold; color: #063542; text-align: center; margin-bottom: 20px; }
  .content { font-size: 16px; }
  .footer { font-size: 12px; color: #777; text-align: center; margin-top: 20px; }
  .button { display: inline-block; padding: 10px 20px; background-color: #51ADC9; color: #fff; text-decoration: none; border-radius: 5px; }
  .message-box { background-color: #fff; padding: 15px; border: 1px solid #eee; border-radius: 5px; margin-top: 15px; }
  .book-details { background-color: #e9f6f9; padding: 10px; border-radius: 5px; margin: 15px 0; }
`;

const getEmailHtml = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>${commonStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">${title}</div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      This is an automated message from the BookDocker GO2 platform.
    </div>
  </div>
</body>
</html>
`;

const getInquiryEmailHtml = (payload: any) => {
    const { expertName, bookTitle, bookAuthor, bookYear, senderEmail, message } = payload;
    const title = `New Book Inquiry: "${bookTitle}"`;
    const body = `
        <p>Hello ${expertName},</p>
        <p>A user is interested in one of your books. You can reply directly to them at: <a href="mailto:${senderEmail}">${senderEmail}</a></p>
        <div class="book-details">
            <strong>Book:</strong> ${bookTitle}<br>
            <strong>Author:</strong> ${bookAuthor}<br>
            <strong>Year:</strong> ${bookYear}
        </div>
        <p><strong>Message from the user:</strong></p>
        <div class="message-box">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
    `;
    return getEmailHtml(title, body);
};

const getContactEmailHtml = (payload: any) => {
    const { expertName, senderEmail, message, links } = payload;
    const title = `New Message from a BookDocker GO2 User`;
    const body = `
        <p>Hello ${expertName},</p>
        <p>You have received a new message from a user on the platform. You can reply directly to them at: <a href="mailto:${senderEmail}">${senderEmail}</a></p>
        <p><strong>Message:</strong></p>
        <div class="message-box">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        ${links ? `<p><strong>Shared Links:</strong> ${links}</p>` : ''}
    `;
    return getEmailHtml(title, body);
};

const getFeedbackEmailHtml = (payload: any) => {
    const { senderName, senderEmail, message } = payload;
    const title = `New Platform Feedback Received`;
    const body = `
        <p>Hello Administrator,</p>
        <p>You have received new feedback for the BookDocker GO2 platform.</p>
        <div class="message-box">
            <p><strong>From:</strong> ${senderName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${senderEmail || 'Not provided'}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
    `;
    return getEmailHtml(title, body);
};

const getInviteEmailHtml = (payload: any) => {
    const { inviterName, message } = payload;
    const title = `${inviterName} sent you an invitation!`;
    const body = `
        <p>Hello,</p>
        <p>Great news! ${inviterName} has invited you to join BookDocker GO2, a community for book lovers and expert collectors.</p>
        ${message ? `<p>They added a personal message for you:</p><div class="message-box"><p>${message.replace(/\n/g, '<br>')}</p></div>` : ''}
        <p>Click the button below to explore the platform:</p>
        <p style="text-align: center; margin: 20px 0;"><a href="${PLATFORM_URL}" class="button">Explore BookDocker GO2</a></p>
    `;
    return getEmailHtml(title, body);
};


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
    // FIX: Cast to `any` to bypass TypeScript error where the `env` property is not recognized on the `Deno` global type.
    const resendApiKey = (globalThis.Deno as any).env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set in Supabase secrets.');
      throw new Error('Email service is not configured. Missing API key.');
    }

    let to, subject, html;

    switch (payload.type) {
      case 'inquiry':
        to = payload.expertEmail;
        subject = `Book Inquiry from BookDocker GO2: "${payload.bookTitle}"`;
        html = getInquiryEmailHtml(payload);
        break;

      case 'contact':
        to = payload.expertEmail;
        subject = `A Message from a BookDocker GO2 User`;
        html = getContactEmailHtml(payload);
        break;

      case 'feedback':
        to = ADMIN_EMAIL;
        subject = `New Feedback for BookDocker GO2`;
        html = getFeedbackEmailHtml(payload);
        break;
      
      case 'invite':
        to = payload.friendEmail;
        subject = `${payload.inviterName} has invited you to BookDocker GO2!`;
        html = getInviteEmailHtml(payload);
        break;

      default:
        throw new Error('Invalid email type specified.');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        console.error("Resend API Error:", errorBody);
        throw new Error(`Failed to send email via provider: ${errorBody.message || 'Unknown error'}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});