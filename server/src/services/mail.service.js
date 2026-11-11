const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const LOGO_URL = 'https://i.pinimg.com/736x/94/26/e6/9426e649f2bada8f0f582d9263205a93.jpg';
const BANANA_ACCENT = '#F5A800';
const INDIA_TIME_ZONE = 'Asia/Kolkata';
let transporter = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatIndiaTime(value) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: INDIA_TIME_ZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value || Date.now())) + ' IST';
}

function isConfigured() {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
    }
    return transporter;
}

async function sendMail({ to, subject, text, html }) {
    if (!isConfigured()) {
        logger.warn(`SMTP is not configured; skipped email "${subject}" to ${to}`);
        return { sent: false, reason: 'not_configured' };
    }

    try {
        const info = await getTransporter().sendMail({
            from: env.MAIL_FROM,
            to,
            subject,
            text,
            html,
        });
        logger.info(`Sent email "${subject}" to ${to} (${info.messageId})`);
        return { sent: true, id: info.messageId };
    } catch (err) {
        logger.error(`Could not send email "${subject}" to ${to}: ${err.message}`);
        return { sent: false, reason: 'send_failed' };
    }
}

function layout({ title, body, footer, preheader = 'A message from Banana Quiz' }) {
    return `<!doctype html>
<html>
  <body style="margin:0;background:#FFF8D6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#542900;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #F3D568;border-radius:24px;overflow:hidden;">
            <tr><td style="padding:24px 28px 16px;background:#FFF1A8;text-align:center;">
              <img src="${LOGO_URL}" width="96" height="96" alt="Banana Quiz" style="display:block;width:96px;height:96px;object-fit:cover;border-radius:50%;margin:0 auto 12px;border:4px solid #ffffff;">
              <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#9B5700;">Banana Quiz</p>
            </td></tr>
            <tr><td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#542900;">${title}</h1>
              ${body}
              <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #F5E5A0;font-size:12px;line-height:1.5;color:#9B5700;">${footer}</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes }) {
    const safeName = escapeHtml(name);
    const greeting = name ? `Hi ${safeName},` : 'Hi,';
    const subject = 'Reset your Banana Quiz password';
    const text = `${greeting}

We received a request to reset your Banana Quiz password. Open this link to choose a new one:
${resetUrl}

The link expires in ${expiresInMinutes} minutes and can only be used once.

If you did not request this, you can safely ignore this email — your password will not change.`;

    const html = layout({
        title: 'Reset your password',
        body: `
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">We received a request to reset your Banana Quiz password. Click the button below to choose a new one.</p>
          <p style="margin:0 0 18px;">
            <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:${BANANA_ACCENT};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:12px;">Reset password</a>
          </p>
          <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#8F4500;">This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8F4500;">If you did not request this, you can safely ignore this email — your password will not change.</p>`,
        footer: 'For your security, never share this link with anyone.',
    });

    return sendMail({ to, subject, text, html });
}

async function sendPasswordChangedEmail({ to, name, changedAt }) {
    const safeName = escapeHtml(name);
    const greeting = name ? `Hi ${safeName},` : 'Hi,';
    const when = formatIndiaTime(changedAt);
    const subject = 'Your Banana Quiz password was changed';
    const text = `${greeting}

Your Banana Quiz password was changed on ${when}.

If this was you, no action is needed. If you did not change it, reset your password immediately and review your recent sign-ins.`;

    const html = layout({
        title: 'Your password was changed',
        body: `
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Your Banana Quiz password was changed on <strong>${when}</strong>.</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#8F4500;">If this was you, no action is needed. If you did not change it, reset your password immediately and review your recent sign-ins.</p>`,
        footer: 'This is an automated security notification.',
    });

    return sendMail({ to, subject, text, html });
}

async function sendWelcomeEmail({ to, name, createdAt, provider = 'email', loginUrl }) {
    const displayName = name || 'Quiz player';
    const safeName = escapeHtml(displayName);
    const created = formatIndiaTime(createdAt);
    const providerLabel = provider === 'email' ? 'email and password' : `${provider} sign-in`;
    const subject = 'Welcome to Banana Quiz 🍌';
    const text = `Hi ${displayName},

Welcome to Banana Quiz! Your account was created with ${providerLabel} on ${created}.

Your account email: ${to}
You can now play quizzes, build streaks, and track your scores.

Open Banana Quiz: ${loginUrl}`;

    const html = layout({
        title: 'Welcome to the banana bunch!',
        preheader: 'Your Banana Quiz account is ready for its first quiz.',
        body: `
          <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hi <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Your Banana Quiz account is ready. Sharpen your knowledge, chase high scores, and keep your streak alive!</p>
          <table role="presentation" width="100%" style="background:#FFF8D6;border-radius:16px;padding:16px;">
            <tr><td style="font-size:14px;line-height:1.7;">
              <strong>Account details</strong><br>
              Email: ${escapeHtml(to)}<br>
              Sign-in: ${escapeHtml(providerLabel)}<br>
              Created: ${escapeHtml(created)}
            </td></tr>
          </table>
          <p style="margin:22px 0 0;text-align:center;">
            <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:${BANANA_ACCENT};color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:12px;">Play your first quiz</a>
          </p>`,
        footer: 'Keep this email for your account details. We will never ask for your password.',
    });

    return sendMail({ to, subject, text, html });
}

async function sendOtpEmail({ to, name, otp, expiresInMinutes, purpose = 'registration' }) {
    const displayName = name || 'Quiz player';
    const safeName = escapeHtml(displayName);
    const code = escapeHtml(otp);
    const isRegistration = purpose === 'registration';
    const action = isRegistration
        ? 'confirm your email and activate your Banana Quiz account'
        : 'verify this email address for your Banana Quiz account';
    const subject = isRegistration
        ? 'Your Banana Quiz verification code'
        : 'Confirm your Banana Quiz email address';
    const text = `Hi ${displayName},

Use this 6-digit code to ${action}:

${otp}

The code expires in ${expiresInMinutes} minutes. If you did not request it, you can safely ignore this email.`;

    const html = layout({
        title: 'Your verification code',
        preheader: `Your Banana Quiz code expires in ${expiresInMinutes} minutes.`,
        body: `
          <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hi <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Use the code below to ${escapeHtml(action)}.</p>
          <div style="margin:0 0 20px;padding:18px 12px;border:2px dashed #F5C542;border-radius:16px;background:#FFFBEA;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#9B5700;">Verification code</p>
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:bold;letter-spacing:10px;color:#542900;">${code}</p>
          </div>
          <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#8F4500;">This code expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8F4500;">If you did not request this code, you can safely ignore this email.</p>`,
        footer: 'For your security, never share this code with anyone. Banana Quiz will never ask for it.',
    });

    return sendMail({ to, subject, text, html });
}

async function sendEmailVerifiedEmail({ to, name, verifiedAt }) {
    const displayName = name || 'Quiz player';
    const when = formatIndiaTime(verifiedAt);
    const subject = 'Your Banana Quiz email is verified';
    const text = `Hi ${displayName},

Your email address ${to} was verified on ${when}.

Your account is now fully activated. If you did not do this, reset your password and contact support.`;

    const html = layout({
        title: 'Email verified',
        preheader: 'Your Banana Quiz account email is now confirmed.',
        body: `
          <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hi <strong>${escapeHtml(displayName)}</strong>,</p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Your email address <strong>${escapeHtml(to)}</strong> was verified on <strong>${escapeHtml(when)}</strong>.</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#8F4500;">Your account is now fully activated. If this was not you, reset your password immediately.</p>`,
        footer: 'This is an automated security notification.',
    });

    return sendMail({ to, subject, text, html });
}

async function sendLoginConfirmationEmail({
    to,
    name,
    loginAt,
    ipAddress = 'Unavailable',
    device = 'Unknown device',
    method = 'password',
    dashboardUrl,
}) {
    const displayName = name || 'Quiz player';
    const when = formatIndiaTime(loginAt);
    const methodLabel = method === 'password' ? 'Email and password' : `${method.charAt(0).toUpperCase()}${method.slice(1)} sign-in`;
    const subject = 'New sign-in to your Banana Quiz account';
    const text = `Hi ${displayName},

Your Banana Quiz account was just signed in to.

Time: ${when}
Method: ${methodLabel}
Device: ${device}
IP address: ${ipAddress}

If this was not you, reset your password immediately and review your recent sign-ins.
Open your dashboard: ${dashboardUrl}`;

    const html = layout({
        title: 'You are signed in!',
        preheader: 'A new sign-in was detected on your Banana Quiz account.',
        body: `
          <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hi <strong>${escapeHtml(displayName)}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Your account was just signed in to. Here are the details:</p>
          <table role="presentation" width="100%" style="background:#FFF8D6;border-radius:16px;padding:16px;">
            <tr><td style="font-size:14px;line-height:1.8;">
              <strong>Sign-in details</strong><br>
              Time: ${escapeHtml(when)}<br>
              Method: ${escapeHtml(methodLabel)}<br>
              Device: ${escapeHtml(device)}<br>
              IP address: ${escapeHtml(ipAddress)}
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#8F4500;">Wasn't you? Reset your password immediately and review your recent sign-ins.</p>
          <p style="margin:20px 0 0;text-align:center;">
            <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:${BANANA_ACCENT};color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:12px;">Open dashboard</a>
          </p>`,
        footer: 'This security notification was sent automatically after a successful sign-in.',
    });

    return sendMail({ to, subject, text, html });
}

module.exports = {
    isConfigured,
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
    sendWelcomeEmail,
    sendOtpEmail,
    sendEmailVerifiedEmail,
    sendLoginConfirmationEmail,
};
