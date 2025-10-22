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

const getEmailHtml = (title: string, body: string, footerText: string) => `
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
      ${footerText}
    </div>
  </div>
</body>
</html>
`;

const getInquiryEmailHtml = (payload: any) => {
    const { expertName, bookTitle, bookAuthor, bookYear, message, expertEmail } = payload;
    const title = `New Book Inquiry: "${bookTitle}"`;
    const privacyNotice = `
      <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">Important Privacy Notice</p>
        <p style="margin-top: 5px; font-size: 14px;">
          Replying to this message will reveal your email address (<strong>${expertEmail}</strong>) to the user. As this email is used to log in to your BookDocker GO2 account, please be mindful of this when communicating. We are actively developing a secure, on-platform messaging system to better protect your privacy in the future.
        </p>
      </div>
    `;
    const body = `
        <p>Hello ${expertName},</p>
        <p>A user is interested in one of your books. Please press "Reply" in your email client to respond to them directly.</p>
        <div class="book-details">
            <strong>Book:</strong> ${bookTitle}<br>
            <strong>Author:</strong> ${bookAuthor}<br>
            <strong>Year:</strong> ${bookYear}
        </div>
        <p><strong>Message from the user:</strong></p>
        <div class="message-box">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        ${privacyNotice}
    `;
    return getEmailHtml(title, body, 'This is an automated message from the BookDocker GO2 platform.');
};

const getContactEmailHtml = (payload: any) => {
    const { expertName, message, links, expertEmail } = payload;
    const title = `New Message from a BookDocker GO2 User`;
    const privacyNotice = `
      <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">Important Privacy Notice</p>
        <p style="margin-top: 5px; font-size: 14px;">
          Replying to this message will reveal your email address (<strong>${expertEmail}</strong>) to the user. As this email is used to log in to your BookDocker GO2 account, please be mindful of this when communicating. We are actively developing a secure, on-platform messaging system to better protect your privacy in the future.
        </p>
      </div>
    `;
    const body = `
        <p>Hello ${expertName},</p>
        <p>You have received a new message from a user. Please press "Reply" in your email client to respond to them directly.</p>
        <p><strong>Message:</strong></p>
        <div class="message-box">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        ${links ? `<p><strong>Shared Links:</strong> ${links}</p>` : ''}
        ${privacyNotice}
    `;
    return getEmailHtml(title, body, 'This is an automated message from the BookDocker GO2 platform.');
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
    return getEmailHtml(title, body, 'This is an automated message sent to the platform administrator.');
};

const getInviteEmailHtml = (payload: any) => {
    const { inviterName, message } = payload;
    const title = `You're Invited to BookDocker GO2!`;
    const body = `
        <p>Hello,</p>
        <p>Great news! Your friend, ${inviterName}, has invited you to join BookDocker GO2, a community for book lovers and expert collectors.</p>
        ${message ? `<p>They added a personal message for you:</p><div class="message-box"><p>${message.replace(/\n/g, '<br>')}</p></div>` : ''}
        <p>Click the button below to explore the platform and see what our experts are sharing:</p>
        <p style="text-align: center; margin: 20px 0;"><a href="${PLATFORM_URL}" class="button">Explore BookDocker GO2</a></p>
    `;
    const footer = `This invitation was sent on behalf of ${inviterName} via the BookDocker GO2 platform.`;
    return getEmailHtml(title, body, footer);
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

    let to, subject, html, reply_to;

    switch (payload.type) {
      case 'inquiry':
        to = payload.expertEmail;
        subject = `Book Inquiry from BookDocker GO2: "${payload.bookTitle}"`;
        html = getInquiryEmailHtml(payload);
        reply_to = payload.senderEmail;
        break;

      case 'contact':
        to = payload.expertEmail;
        subject = `A Message from a BookDocker GO2 User`;
        html = getContactEmailHtml(payload);
        reply_to = payload.senderEmail;
        break;

      case 'feedback':
        to = ADMIN_EMAIL;
        subject = `New Feedback for BookDocker GO2`;
        html = getFeedbackEmailHtml(payload);
        break;
      
      case 'invite':
        to = payload.friendEmail;
        subject = `${payload.inviterName} has invited you to join BookDocker GO2!`;
        html = getInviteEmailHtml(payload);
        break;

      default:
        throw new Error('Invalid email type specified.');
    }
    
    const resendPayload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        reply_to?: string;
    } = {
        from: FROM_ADDRESS,
        to,
        subject,
        html,
    };

    if (reply_to) {
        resendPayload.reply_to = reply_to;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(resendPayload),
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