const nodemailer = require('nodemailer');
const { env } = require('./env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendResetCodeEmail(toEmail, code) {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject: '[HRTMS] Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a1a1a;">Password Reset Request</h2>
        <p>Your password reset code is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px;
                    color: #4F46E5; padding: 16px; background: #F5F3FF;
                    border-radius: 8px; text-align: center; margin: 16px 0;">
          ${code}
        </div>
        <p>This code expires in <strong>15 minutes</strong>.</p>
        <p style="color: #888;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendResetCodeEmail };
