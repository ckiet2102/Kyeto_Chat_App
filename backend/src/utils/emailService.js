import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, text }) => {
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 465);

  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Bypass - Missing Credentials] Target: ${to} | Subject: ${subject}`);
    return { success: true, bypassed: true };
  }

  try {
    // Port 465 SSL is required on Cloud Hosting (Render/AWS) where Port 587 TLS is blocked
    const transporter = nodemailer.createTransport({
      host: smtpHost.includes("gmail") ? "smtp.gmail.com" : smtpHost,
      port: smtpPort,
      secure: smtpPort === 465 || smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log(`[Email Service] Attempting SMTP send to ${to} via ${smtpUser} (Port ${smtpPort})...`);

    const info = await Promise.race([
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

    console.log(`[Email Service Success] Successfully delivered email to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message || error);
    return { success: false, error: error.message || String(error) };
  }
};
