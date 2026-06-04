import nodemailer from "nodemailer";
import logger from "../config/logger.js";

let transporter = null;
let etherealUrl = null;

/**
 * Initialise the mail transporter.
 * In development, uses Ethereal (fake SMTP — emails are viewable via a web URL).
 * In production, reads SMTP_* env vars.
 */
async function initTransporter() {
  if (transporter) return transporter;

  // If SMTP credentials are explicitly configured, use them regardless of NODE_ENV
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify the connection works
    try {
      await transporter.verify();
      logger.info(`✓ SMTP configured — sending via ${process.env.SMTP_HOST}`);
    } catch (err) {
      logger.warn(`SMTP connection failed for ${process.env.SMTP_HOST}: ${err.message} — falling back to Ethereal`);
      transporter = null;
    }
  }

  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("SMTP_HOST not set — email sending disabled in production");
      return null;
    }

    // Development — use Ethereal (captures emails, viewable at etherealUrl)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      etherealUrl = "https://ethereal.email/login";
      logger.info(`✓ Ethereal mail account created — view emails at ${etherealUrl}`);
    } catch (err) {
      logger.warn("Failed to create Ethereal test account — email sending disabled:", err.message);
      return null;
    }
  }

  return transporter;
}

/**
 * Send a password-reset email with a 6-digit verification code.
 * The code is entered directly on the website — no token in the URL.
 * Returns the Ethereal preview URL in dev mode, or true in production.
 */
export async function sendPasswordResetEmail(toEmail, resetCode) {
  const transport = await initTransporter();
  if (!transport) {
    logger.warn("Mail transport not available — skipping password reset email");
    return null;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetPageUrl = `${frontendUrl}/reset-password`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your AetherStudio verification code</title>
</head>
<body style="margin:0;padding:0;background:#0d0d10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d10;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="color:#f5f5f7;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AetherStudio</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(22,22,26,0.95);border-radius:16px;padding:36px 32px;border:1px solid rgba(255,255,255,0.06);">
              <h1 style="color:#f5f5f7;font-size:20px;font-weight:600;margin:0 0 8px;letter-spacing:-0.3px;">
                Reset your password
              </h1>
              <p style="color:rgba(255,255,255,0.4);font-size:14px;line-height:1.6;margin:0 0 24px;">
                We received a request to reset the password for your AetherStudio account. Use the verification code below to set a new one.
              </p>

              <!-- Verification Code -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;" width="100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:20px 32px;">
                      <tr>
                        <td align="center" style="font-size:36px;font-weight:700;letter-spacing:12px;color:#f5f5f7;font-family:SF Mono, 'Fira Code', 'Cascadia Code', monospace;user-select:all;">
                          ${resetCode}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;" width="100%">
                <tr>
                  <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#b89450,#d4bc80);padding:12px 32px;">
                    <a href="${resetPageUrl}" target="_blank" style="color:#fff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                      Go to Reset Page
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:rgba(255,255,255,0.25);font-size:13px;line-height:1.5;margin:0 0 4px;">
                Or go to ${resetPageUrl} and enter the code above.
              </p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.04);margin:20px 0 16px;" />

              <p style="color:rgba(255,255,255,0.2);font-size:12px;line-height:1.5;margin:0;">
                This code expires in <strong style="color:rgba(255,255,255,0.3);">15 minutes</strong>.
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="color:rgba(255,255,255,0.1);font-size:11px;margin:0;">
                &copy; ${new Date().getFullYear()} AetherStudio. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || '"AetherStudio" <noreply@aetherstudio.app>',
    to: toEmail,
    subject: "Your AetherStudio verification code",
    text: `Your AetherStudio verification code is: ${resetCode}\n\nEnter this code at ${resetPageUrl} to reset your password.\n\nThis code expires in 15 minutes.\nIf you didn't request this, you can ignore this email.`,
    html,
  });

  // In development, log the Ethereal preview URL
  if (process.env.NODE_ENV !== "production" && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info(`Reset code sent to ${toEmail}: ${resetCode} — preview at ${previewUrl}`);
    return previewUrl;
  }

  logger.info(`Reset code sent to ${toEmail} (messageId: ${info.messageId})`);
  return true;
}
