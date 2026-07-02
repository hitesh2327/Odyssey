import nodemailer from 'nodemailer';
import { config } from '../config';
import { OtpType } from '../types/otp';
import { logger } from './logger';

if (!config.SMTP_USER || !config.SMTP_PASS) {
  logger.warn('⚠️ SMTP_USER or SMTP_PASS environment variable is not defined. Email operations will fail at runtime.');
}

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER || '',
    pass: config.SMTP_PASS || '',
  },
});

function buildOtpEmail({ otp, type, name }: { otp: string; type: OtpType; name?: string }): string {
  let heading = '';
  let subtext = '';

  const firstName = name ? name.split(' ')[0] : '';

  if (type === 'verify_email') {
    heading = `Welcome aboard${firstName ? ', ' + firstName : ''}.`;
    subtext = 'Use the code below to verify your email address and begin your voyage.';
  } else if (type === 'change_email') {
    heading = 'Confirm your new address.';
    subtext = 'Enter this code to confirm the change to your email address.';
  } else if (type === 'reset_password') {
    heading = 'Reset your password.';
    subtext = 'Use this code to set a new password for your account.';
  }

  // Compass SVG
  const svgLogo = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      <circle cx="24" cy="24" r="21" stroke="#161B33" stroke-width="2"/>
      <path d="M24 10L27 21L38 24L27 27L24 38L21 27L10 24L21 21L24 10Z" fill="#161B33"/>
    </svg>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${heading}</title>
    </head>
    <body style="margin: 0; padding: 40px 0; width: 100%; background-color: #F8F5EE; font-family: Georgia, serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 14px; box-shadow: 0 4px 12px rgba(22, 27, 51, 0.05); border: 1px solid #E4E1D6;">
        <tr>
          <td style="padding: 48px 40px; text-align: center;">
            <!-- Header Logo -->
            <div style="margin-bottom: 12px; height: 48px; text-align: center;">
              ${svgLogo}
            </div>
            <!-- Wordmark -->
            <div style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #161B33; margin-bottom: 24px; text-transform: lowercase; letter-spacing: 0.05em;">
              odyssey
            </div>
            
            <!-- Separator -->
            <div style="border-top: 1px dashed #E4E1D6; margin-bottom: 32px; width: 100%;"></div>

            <!-- Heading -->
            <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #161B33; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
              ${heading}
            </h1>
            
            <!-- Subtext -->
            <p style="font-family: 'Inter', sans-serif; font-size: 14.5px; color: #4A4A4A; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
              ${subtext}
            </p>

            <!-- OTP Code Display -->
            <div style="margin: 32px auto; display: inline-block;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #F1E3C7; border-radius: 10px; padding: 20px 36px; text-align: center; letter-spacing: 0.18em; font-family: Courier, monospace; font-size: 38px; font-weight: 700; color: #161B33;">
                    ${otp}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Expiry Warning -->
            <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #9A9DAE; margin-top: 0; margin-bottom: 32px;">
              This code expires in 10 minutes.
            </p>

            <!-- Separator -->
            <div style="border-top: 1px dashed #E4E1D6; margin-bottom: 24px; width: 100%;"></div>

            <!-- Footer -->
            <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #9A9DAE; line-height: 1.5; margin-top: 0; margin-bottom: 16px; text-align: center;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #9A9DAE; margin: 0; text-align: center; font-weight: bold;">
              &copy; Odyssey
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export const emailService = {
  async sendOtpEmail(to: string, otp: string, type: OtpType, name?: string) {
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      logger.error(`[EMAIL_SERVICE] Cannot send OTP email of type ${type} to ${to}: SMTP credentials not configured.`);
      return;
    }

    const subjects = {
      verify_email: 'Verify your Odyssey account',
      change_email: 'Confirm your new email address',
      reset_password: 'Reset your Odyssey password',
    };

    await transporter.sendMail({
      from: `"${config.SMTP_FROM_NAME}" <${config.SMTP_USER}>`,
      to,
      subject: subjects[type],
      html: buildOtpEmail({ otp, type, name }),
    });
  },
};
