import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Diagnostic GET route to verify Vercel Environment Variables setup
  if (req.method === 'GET') {
    const rawPass = process.env.SMTP_PASS || '';
    const cleanPass = rawPass.replace(/\s+/g, '');
    const user = process.env.SMTP_USER || 'glifebautista@gmail.com';

    return res.status(200).json({
      status: 'online',
      platform: 'Vercel Serverless',
      smtpUser: user,
      smtpPassConfigured: Boolean(cleanPass),
      smtpPassLength: cleanPass.length,
      note: cleanPass.length === 16 
        ? '✅ Gmail App Password length is 16 chars (correct).' 
        : cleanPass.length > 0 
          ? `⚠️ Warning: App password length is ${cleanPass.length} (expected 16 chars).` 
          : '❌ SMTP_PASS is missing in Vercel Environment Variables!',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST to send email.' });
  }

  try {
    // Parse request body safely (Vercel serverless functions can pass object or raw JSON string)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // use raw body if parse fails
      }
    }
    body = body || {};

    const { to, subject, text, html, from } = body;

    if (!to || !subject || !text) {
      return res.status(400).json({ 
        error: 'Missing required email parameters: "to", "subject", or "text".' 
      });
    }

    const senderEmail = from || process.env.SMTP_USER || 'adrich.glife.abelon@gmail.com';
    const senderDisplay = `Adrich Glife Abelon (Auxiliadora Media Admin) <${senderEmail}>`;

    const smtpUser = process.env.SMTP_USER || 'glifebautista@gmail.com';
    const rawSmtpPass = process.env.SMTP_PASS || '';
    // Clean spaces from Google App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const cleanSmtpPass = rawSmtpPass.replace(/\s+/g, '');

    console.log(`[VERCEL EMAIL] Attempting dispatch to ${to} via ${smtpUser}...`);

    if (!cleanSmtpPass) {
      return res.status(400).json({
        success: false,
        error: 'SMTP_PASS environment variable is NOT set in Vercel! Please add SMTP_PASS in your Vercel Project Settings -> Environment Variables, then RE-DEPLOY your project.'
      });
    }

    // Direct Google SMTP configuration using port 465 (SSL) for high reliability on Vercel/Cloud functions
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: cleanSmtpPass,
      },
      // Timeout settings for serverless environments
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Send email via Gmail SMTP
    const info = await transporter.sendMail({
      from: senderDisplay,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br/>'),
    });

    console.log(`[VERCEL EMAIL SUCCESS] Message ID: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: `Email successfully sent to ${to}`,
      sender: senderDisplay,
      recipient: to,
      subject,
      timestamp: new Date().toISOString(),
      messageId: info?.messageId || `msg_${Date.now()}`
    });

  } catch (error: any) {
    console.error('[VERCEL EMAIL ERROR]', error);
    
    let userFriendlyError = error.message || 'Failed to send email directly via Vercel.';

    if (userFriendlyError.includes('Invalid login') || userFriendlyError.includes('535') || userFriendlyError.includes('BadCredentials')) {
      userFriendlyError = 'Gmail Authentication Failed (535 Bad Credentials). Ensure SMTP_PASS in Vercel is a 16-character Google "App Password" (generated at Google Account -> Security -> 2-Step Verification -> App passwords), NOT your standard account password.';
    } else if (userFriendlyError.includes('ETIMEDOUT') || userFriendlyError.includes('ECONNREFUSED')) {
      userFriendlyError = 'Connection to Gmail SMTP timed out. Please retry in a few moments.';
    }

    return res.status(500).json({ 
      success: false,
      error: userFriendlyError,
      details: error.message
    });
  }
}

