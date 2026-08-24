import nodemailer from "nodemailer";
import dns from "dns";

export const sendEmail = async ({ to, subject, html, text }) => {
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();

  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Bypass - Missing Credentials] Target: ${to} | Subject: ${subject}`);
    return { success: true, bypassed: true };
  }

  try {
    let resolvedHost = smtpHost;
    const isGmail = smtpHost.includes("gmail") || smtpUser.includes("@gmail.com");

    if (isGmail) {
      try {
        const addresses = await dns.promises.resolve4("smtp.gmail.com");
        if (addresses && addresses.length > 0) {
          resolvedHost = addresses[0]; // e.g. "142.250.141.108"
        }
      } catch (dnsErr) {
        console.warn("[Email Service] IPv4 DNS resolve fallback:", dnsErr.message);
      }
    }

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: 465,
      secure: true,
      tls: {
        servername: "smtp.gmail.com",
        rejectUnauthorized: false,
      },
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log(`[Email Service] Attempting IPv4 direct send to ${to} via ${smtpUser} (${resolvedHost}:465)...`);

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
