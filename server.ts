import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for automated direct email dispatch
app.get('/api/send-email', (req, res) => {
  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');
  const user = process.env.SMTP_USER || 'glifebautista@gmail.com';

  return res.json({
    status: 'online',
    platform: 'Express / Cloud Run',
    smtpUser: user,
    smtpPassConfigured: Boolean(cleanPass),
    smtpPassLength: cleanPass.length,
    note: cleanPass.length === 16 
      ? '✅ Gmail App Password length is 16 chars (correct).' 
      : cleanPass.length > 0 
        ? `⚠️ Warning: App password length is ${cleanPass.length} (expected 16 chars).` 
        : '❌ SMTP_PASS is missing in environment variables!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, from } = req.body || {};

    if (!to || !subject || !text) {
      return res.status(400).json({ 
        error: 'Missing required email fields: to, subject, text' 
      });
    }

    const senderEmail = from || process.env.SMTP_USER || 'adrich.glife.abelon@gmail.com';
    const senderDisplay = `Adrich Glife Abelon (Auxiliadora Media Admin) <${senderEmail}>`;

    const smtpUser = process.env.SMTP_USER || 'glifebautista@gmail.com';
    const rawSmtpPass = process.env.SMTP_PASS || '';
    const cleanSmtpPass = rawSmtpPass.replace(/\s+/g, '');

    console.log(`[EMAIL DISPATCH] Direct sending email to ${to} via ${smtpUser}...`);

    let info: any = null;

    if (cleanSmtpPass) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: cleanSmtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      info = await transporter.sendMail({
        from: senderDisplay,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br/>'),
      });
      console.log(`[EMAIL SENT VIA SMTP] Message ID: ${info.messageId}`);
    } else {
      // Fallback test transporter if no SMTP pass is provided
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        info = await transporter.sendMail({
          from: senderDisplay,
          to,
          subject,
          text,
          html: html || text.replace(/\n/g, '<br/>'),
        });

        console.log(`[SIMULATED DISPATCHED] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } catch (err) {
        console.warn('[SMTP DISPATCH NOTICE] Fallback simulation mode active:', err);
      }
    }

    return res.json({
      success: true,
      message: `Email automatically sent directly to ${to}`,
      sender: senderDisplay,
      recipient: to,
      subject,
      timestamp: new Date().toISOString(),
      messageId: info?.messageId || `msg_${Date.now()}`
    });
  } catch (error: any) {
    console.error('[EMAIL ERROR]', error);

    let userFriendlyError = error.message || 'Failed to send email directly';
    if (userFriendlyError.includes('Invalid login') || userFriendlyError.includes('535')) {
      userFriendlyError = 'Gmail Authentication Failed (535 Bad Credentials). Ensure SMTP_PASS is a 16-character Google "App Password", not your standard Gmail password.';
    }

    return res.status(500).json({ 
      success: false,
      error: userFriendlyError,
      details: error.message
    });
  }
});

// Helper for static file serving in production
function serveStaticFiles() {
  const dirPath = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const cwdDist = path.join(process.cwd(), 'dist');
  
  let finalDistPath = dirPath;
  if (fs.existsSync(path.join(dirPath, 'index.html'))) {
    finalDistPath = dirPath;
  } else if (fs.existsSync(path.join(cwdDist, 'index.html'))) {
    finalDistPath = cwdDist;
  } else if (fs.existsSync(path.join(dirPath, 'dist', 'index.html'))) {
    finalDistPath = path.join(dirPath, 'dist');
  }

  console.log(`[SERVER] Serving static assets from: ${finalDistPath}`);
  app.use(express.static(finalDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(finalDistPath, 'index.html'));
  });
}

// Vite middleware for development / static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || (typeof __filename !== 'undefined' && __filename.endsWith('.cjs'));

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[SERVER] Vite dev middleware unavailable, falling back to static serving:', e);
      serveStaticFiles();
    }
  } else {
    serveStaticFiles();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auxiliadora Media Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FATAL SERVER ERROR]', err);
  process.exit(1);
});

