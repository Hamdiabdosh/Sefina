import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "../config/env";

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });
};

const expiryLabel = (): string => {
  const hours = env.RESET_TOKEN_EXPIRY_HOURS;
  return hours === 1 ? "1 hour" : `${hours} hours`;
};

const buildEmailHtml = (options: {
  title: string;
  body: string;
  buttonLabel: string;
  actionUrl: string;
  footerNote: string;
}): string => {
  const { title, body, buttonLabel, actionUrl, footerNote } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d4;">
        <tr><td style="background:#2dd4bf;padding:24px 28px;">
          <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">Sefinet Al Neja</p>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">Harari Medresa Management</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#134e4a;">${title}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;">${body}</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${actionUrl}" style="display:inline-block;background:#2dd4bf;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">${buttonLabel}</a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:11px;word-break:break-all;color:#0d9488;">${actionUrl}</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">${footerNote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  const transporter = getTransporter();

  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
): Promise<void> => {
  const html = buildEmailHtml({
    title: "Reset your password",
    body: "You requested a password reset for your Sefinet Al Neja account. Click the button below to choose a new password.",
    buttonLabel: "Reset password",
    actionUrl: resetUrl,
    footerNote: `This link expires in ${expiryLabel()}. If you did not request a reset, you can safely ignore this email.`,
  });

  await sendEmail(email, "Sefinet Al Neja — Reset your password", html);
};

export const sendWelcomeEmail = async (email: string, resetUrl: string): Promise<void> => {
  const html = buildEmailHtml({
    title: "Welcome — set your password",
    body: "Your Sefinet Al Neja account has been created. Click the button below to set your password and sign in.",
    buttonLabel: "Set your password",
    actionUrl: resetUrl,
    footerNote: `This link expires in ${expiryLabel()}. If you did not expect this email, contact your administrator.`,
  });

  await sendEmail(email, "Sefinet Al Neja — Set your password", html);
};
