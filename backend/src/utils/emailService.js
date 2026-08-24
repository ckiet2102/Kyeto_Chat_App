import nodemailer from "nodemailer";

let transporter;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Fallback for development: Ethereal / Console log
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Service Bypass] Email to ${to}: ${subject}`);
    return true;
  }
  try {
    const senderEmail = process.env.SMTP_USER || "noreply@kyeto.chat";
    await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Kyeto Chat" <${senderEmail}>`,
        to,
        subject,
        text: text || (html ? html.replace(/<[^>]*>?/gm, "") : ""),
        html,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email send timeout after 3s")), 3000)
      ),
    ]);
    console.log(`[Email Service] Sent email to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email Service Warning]:", error.message);
    return false;
  }
};
