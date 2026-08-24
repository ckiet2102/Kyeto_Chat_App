import nodemailer from "nodemailer";

let transporter;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
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
  try {
    const senderEmail = process.env.SMTP_USER || "noreply@kyeto.chat";
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Kyeto Chat" <${senderEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html,
    });
    console.log(`[Email Service] Sent email to ${to}: ${subject}`);
    if (info.message) {
      console.log(`[Email Content Log]:`, info.message);
    }
    return true;
  } catch (error) {
    console.error("[Email Service Error]:", error);
    return false;
  }
};
