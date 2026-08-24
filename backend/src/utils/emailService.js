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
    // For Gmail on cloud hosting (Render), Port 465 with SSL (secure: true) is mandatory because Port 587 is blocked
    const isGmail = smtpHost.includes("gmail") || smtpService === "gmail" || smtpUser.includes("@gmail.com");
    const finalPort = isGmail ? 465 : (smtpPort || 465);
    const finalSecure = isGmail ? true : (finalPort === 465);

    const transporter = nodemailer.createTransport({
      host: isGmail ? "smtp.gmail.com" : smtpHost,
      port: finalPort,
      secure: finalSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log(`[Email Service] Attempting SMTP send to ${to} via ${smtpUser} (Host: ${isGmail ? "smtp.gmail.com" : smtpHost}, Port: ${finalPort}, Secure: ${finalSecure})...`);

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
