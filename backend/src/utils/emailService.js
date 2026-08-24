import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, text }) => {
  const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
  const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";

  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Bypass] No SMTP User/Pass. Email to ${to}: ${subject}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Kyeto Chat" <${smtpUser}>`,
        to: to.trim(),
        subject,
        text: text || (html ? html.replace(/<[^>]*>?/gm, "") : ""),
        html,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email send timeout after 15s")), 15000)
      ),
    ]);

    console.log(`[Email Service] Successfully sent email to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email Service Error]:", error.message || error);
    return false;
  }
};
