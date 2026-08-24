import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 resolution on cloud providers like Render where IPv6 is unreachable (ENETUNREACH)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

export const sendEmail = async ({ to, subject, html, text }) => {
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const rawPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
  const smtpPort = Number(rawPort) || 465;

  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Bypass - Missing Credentials] Target: ${to} | Subject: ${subject}`);
    return { success: true, bypassed: true };
  }

  try {
    const isGmail = smtpHost.includes("gmail") || smtpUser.includes("@gmail.com");
    const finalPort = isGmail ? 465 : smtpPort;
    const finalSecure = isGmail ? true : (finalPort === 465);

    const transporter = nodemailer.createTransport({
      host: isGmail ? "smtp.gmail.com" : smtpHost,
      port: finalPort,
      secure: finalSecure,
      family: 4, // Force IPv4 to prevent ENETUNREACH error on Render
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log(`[Email Service] Sending via ${smtpUser} (Host: ${isGmail ? "smtp.gmail.com" : smtpHost}, Port: ${finalPort}, Secure: ${finalSecure}, IPv4)...`);

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

    console.log(`[Email Service Success] Delivered email to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message || error);
    return { success: false, error: error.message || String(error) };
  }
};
