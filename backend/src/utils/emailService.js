import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, text }) => {
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const smtpService = (process.env.SMTP_SERVICE || "").trim();

  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Bypass - Missing Credentials] Target: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    const transportOptions = smtpService
      ? { service: smtpService, auth: { user: smtpUser, pass: smtpPass } }
      : smtpHost.includes("gmail")
      ? { service: "gmail", auth: { user: smtpUser, pass: smtpPass } }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        };

    const transporter = nodemailer.createTransport(transportOptions);

    console.log(`[Email Service] Attempting to send email to ${to} via ${smtpUser}...`);

    await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Kyeto Chat" <${smtpUser}>`,
        to: to.trim(),
        subject,
        text: text || (html ? html.replace(/<[^>]*>?/gm, "") : ""),
        html,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email send operation timed out after 15 seconds")), 15000)
      ),
    ]);

    console.log(`[Email Service Success] Successfully delivered email to ${to} (Subject: ${subject})`);
    return true;
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message || error);
    return false;
  }
};
