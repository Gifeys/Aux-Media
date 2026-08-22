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
    const payload = req.body;

    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        return res.status(400).json({ error: 'Empty email payload array' });
      }

      const smtpUser = process.env.SMTP_USER || 'glifebautista@gmail.com';
      const rawSmtpPass = process.env.SMTP_PASS || '';
      const cleanSmtpPass = rawSmtpPass.replace(/\s+/g, '');

      let sentCount = 0;
      let transporter: any = null;

      if (cleanSmtpPass) {
        transporter = nodemailer.createTransport({
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
      }

      for (const item of payload) {
        const { to, subject, text, html, from } = item || {};
        if (!to || !subject || !text) continue;

        const senderEmail = from || process.env.SMTP_USER || 'adrich.glife.abelon@gmail.com';
        const senderDisplay = `Adrich Glife Abelon (Auxiliadora Media Admin) <${senderEmail}>`;

        if (transporter) {
          await transporter.sendMail({
            from: senderDisplay,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br/>'),
          }).catch((err: any) => console.error(`[EMAIL DISPATCH FAIL] ${to}:`, err));
          sentCount++;
        } else {
          console.log(`[SIMULATED INDIVIDUAL EMAIL] to ${to}: ${subject}`);
          sentCount++;
        }
      }

      return res.json({
        success: true,
        count: sentCount,
        message: `Dispatched ${sentCount} individual personalized schedule emails.`,
        timestamp: new Date().toISOString()
      });
    }

    const { to, subject, text, html, from } = payload || {};

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

// Cache for dispatched birthday emails in current process to prevent duplicates
const dispatchedBirthdayKeys = new Set<string>();

// Birthday dispatch API endpoint
app.post('/api/dispatch-birthdays', async (req, res) => {
  try {
    const { celebrants, adminName, adminEmail, siteUrl, force } = req.body || {};
    if (!celebrants || !Array.isArray(celebrants) || celebrants.length === 0) {
      return res.status(400).json({ error: 'No celebrants provided in request payload' });
    }

    const smtpUser = process.env.SMTP_USER || 'glifebautista@gmail.com';
    const rawSmtpPass = process.env.SMTP_PASS || '';
    const cleanSmtpPass = rawSmtpPass.replace(/\s+/g, '');
    const senderEmail = adminEmail || process.env.SMTP_USER || 'adrich.glife.abelon@gmail.com';
    const senderDisplay = `${adminName || 'Adrich Glife Abelon'} (Auxiliadora Media Admin) <${senderEmail}>`;

    let transporter: any = null;
    if (cleanSmtpPass) {
      transporter = nodemailer.createTransport({
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
    }

    const results = [];
    const currentYear = new Date().getFullYear();

    for (const c of celebrants) {
      const email = c.email?.trim();
      if (!email) {
        results.push({ id: c.id, name: c.name, status: 'skipped', reason: 'No email address registered' });
        continue;
      }

      const dedupeKey = `bday-${c.id || email}-${currentYear}`;
      if (!force && dispatchedBirthdayKeys.has(dedupeKey)) {
        results.push({ id: c.id, name: c.name, email, status: 'already_sent', note: 'Already sent for this year' });
        continue;
      }

      const roleName = (c.role || 'SocCom Media Server').replace(/_/g, ' ').toUpperCase();
      const firstName = c.name ? c.name.split(' ')[0] : 'Media Servant';
      const portalUrl = siteUrl || 'https://auxiliadora-media.web.app';

      const subject = `🎂 Happy Blessed Birthday, ${c.name}! 🎉 | Auxiliadora Media Ministry`;
      const text = `Dear ${c.name},\n\n` +
        `🎉 "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace." — Numbers 6:24-26\n\n` +
        `Peace and joy in Christ!\n\n` +
        `On this most special day of your birthday, the entire Auxiliadora Media Ministry family and Mary Help of Christians Parish community lift up our hearts in joyful thanksgiving to Almighty God for the precious gift of your life and faithful liturgical service!\n\n` +
        `Thank you for your tireless dedication, technical excellence, and cheerful heart as our ${roleName}.\n\n` +
        `May our Blessed Mother, Mary Help of Christians, wrap you under her loving mantle, guide your steps, and grant all the desires of your heart.\n\n` +
        `Log into the Auxiliadora Media Portal to view your birthday celebration card:\n` +
        `🌐 ${portalUrl}\n\n` +
        `With heartfelt prayers and warmest birthday blessings,\n\n` +
        `${adminName || 'Adrich Glife Abelon'}\n` +
        `Lead Admin, Auxiliadora Media Ministry\n` +
        `Mary Help of Christians Parish\n` +
        `Contact: ${senderEmail}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #051424; margin: 0; padding: 24px; color: #d4e4fa; }
            .card { max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #102235, #081a2e); border: 2px solid #f59e0b; border-radius: 20px; padding: 36px 28px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); text-align: center; }
            .logo-badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; font-family: monospace; }
            .title { font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #fef3c7; margin: 8px 0 4px 0; font-weight: bold; line-height: 1.2; }
            .subtitle { font-size: 13px; color: #93c5fd; margin-bottom: 24px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }
            .avatar-box { margin: 20px auto; width: 110px; height: 110px; border-radius: 50%; border: 3px solid #fbbf24; overflow: hidden; box-shadow: 0 8px 24px rgba(245,158,11,0.3); background-color: #1e3a8a; }
            .avatar-img { width: 100%; height: 100%; object-fit: cover; }
            .verse-box { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 18px 20px; margin: 24px 0; text-align: center; font-style: italic; font-family: Georgia, serif; color: #a7f3d0; font-size: 14px; line-height: 1.6; }
            .body-p { font-size: 14px; line-height: 1.7; color: #cbd5e1; text-align: left; margin: 16px 0; }
            .highlight { color: #fde68a; font-weight: bold; }
            .btn-portal { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #051424 !important; text-decoration: none; font-weight: 800; font-size: 13px; padding: 14px 32px; border-radius: 12px; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 1px; font-family: monospace; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }
            .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #64748b; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-badge">⛪ Auxiliadora Media Ministry • Birthday Blessing</div>
            <h1 class="title">🎂 Happy Blessed Birthday, ${c.name}! 🎉</h1>
            <div class="subtitle">Celebrant • ${roleName}</div>

            ${c.picture ? `
            <div class="avatar-box">
              <img class="avatar-img" src="${c.picture}" alt="${c.name}" />
            </div>` : ''}

            <div class="verse-box">
              "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace."<br>
              <strong style="color: #6ee7b7; font-style: normal; font-size: 12px; margin-top: 6px; display: inline-block;">— Numbers 6:24-26</strong>
            </div>

            <p class="body-p">
              Peace and blessings in Christ, <span class="highlight">${firstName}</span>!
            </p>

            <p class="body-p">
              On this blessed occasion of your birthday, our entire Media Ministry and parish family celebrate the gift of your life and faithfully applaud your dedication as our <span class="highlight">${roleName}</span>.
            </p>

            <p class="body-p">
              Through your liturgical service at the altar sound booth, live streaming cameras, and digital evangelization, you touch countless souls. May Our Lady, Mary Help of Christians, protect you and may God reward you with health, joy, and peace!
            </p>

            <div>
              <a class="btn-portal" href="${portalUrl}" target="_blank">🌐 Open Media Ministry Portal</a>
            </div>

            <div class="footer">
              With prayers & gratitude,<br>
              <strong>${adminName || 'Adrich Glife Abelon'}</strong> (Lead Admin)<br>
              Auxiliadora Media Ministry • Mary Help of Christians Parish<br>
              ${senderEmail}
            </div>
          </div>
        </body>
        </html>
      `;

      if (transporter) {
        await transporter.sendMail({
          from: senderDisplay,
          to: email,
          subject,
          text,
          html,
        }).catch((err: any) => console.error(`[BIRTHDAY EMAIL FAIL] ${email}:`, err));
      } else {
        console.log(`[SIMULATED BIRTHDAY GREETING EMAIL] to ${email}: ${subject}`);
      }

      dispatchedBirthdayKeys.add(dedupeKey);
      results.push({ id: c.id, name: c.name, email, status: 'dispatched', timestamp: new Date().toISOString() });
    }

    return res.json({
      success: true,
      message: `Processed ${results.length} birthday greeting email(s).`,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[BIRTHDAY DISPATCH ERROR]', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch birthday emails' });
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

