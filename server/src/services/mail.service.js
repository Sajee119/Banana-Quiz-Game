const nodemailer = require('nodemailer');
const env = require('../../../../../Banana-Quiz-Game/server/src/config/env');
const logger = require('../../../../../Banana-Quiz-Game/server/src/utils/logger');

let transporter = null;

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

function layout({ title, body, footer }) {
    return `<!doctype html>
<html>
  <body style="margin:0;background:#FFFCEB;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#6B3200;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:2px solid #FFEC85;border-radius:20px;padding:28px;">
            <tr><td>
              <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#F5A800;">Banana Quiz</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#6B3200;">${title}</h1>
              ${body}
              <p style="margin:24px 0 0;font-size:12px;color:#B56000;">${footer}</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes }) {
    const greeting = name ? `Hi ${name},` : 'Hi,';
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
            <a href="${resetUrl}" style="display:inline-block;background:#F5A800;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:12px;">Reset password</a>
          </p>
          <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#8F4500;">This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8F4500;">If you did not request this, you can safely ignore this email — your password will not change.</p>`,
        footer: 'For your security, never share this link with anyone.',
    });

    return sendMail({ to, subject, text, html });
}

async function sendPasswordChangedEmail({ to, name, changedAt }) {
    const greeting = name ? `Hi ${name},` : 'Hi,';
    const when = new Date(changedAt || Date.now()).toUTCString();
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

module.exports = {
    isConfigured,
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
};
