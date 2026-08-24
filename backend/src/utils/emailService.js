import nodemailer from "nodemailer";
import dns from "dns";

export const sendEmail = async ({ to, subject, html, text }) => {
  const targetEmail = to.trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();

  // 1. HTTP REST API: Brevo (Sendinblue) - Allows sending to ANY recipient email address
  if (brevoApiKey) {
    try {
      console.log(`[Email Service] Sending via Brevo HTTP API to ${targetEmail}...`);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Kyeto Chat", email: "noreply@kyeto.chat" },
          to: [{ email: targetEmail }],
          subject,
          htmlContent: html,
          textContent: text || (html ? html.replace(/<[^>]*>?/gm, "") : ""),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Email Service Success] Brevo delivered to ${targetEmail}, MessageId: ${data.messageId}`);
        return { success: true, provider: "Brevo", messageId: data.messageId };
      } else {
        console.error("[Email Service Brevo Error]:", data);
        return {
          success: false,
          provider: "Brevo",
          error: data.message || data.code || JSON.stringify(data),
          details: data,
        };
      }
    } catch (apiErr) {
      console.error("[Email Service Brevo Exception]:", apiErr.message);
      return { success: false, provider: "Brevo", error: apiErr.message };
    }
  }

  // 2. HTTP REST API: Resend (Best for Cloud Hosting like Render/Vercel)
  if (resendApiKey) {
    try {
      console.log(`[Email Service] Sending via Resend HTTP API to ${targetEmail}...`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Kyeto Chat <onboarding@resend.dev>",
          to: [targetEmail],
          subject,
          html,
          text: text || (html ? html.replace(/<[^>]*>?/gm, "") : ""),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Email Service Success] Resend delivered to ${targetEmail}, ID: ${data.id}`);
        return { success: true, provider: "Resend", id: data.id };
      } else {
        console.error("[Email Service Resend Error]:", data);
        if (!brevoApiKey) {
          return {
            success: false,
            provider: "Resend",
            error: data.message || data.name || JSON.stringify(data),
            details: data,
          };
        }
      }
    } catch (apiErr) {
      console.error("[Email Service Resend Exception]:", apiErr.message);
    }
  }

  // 3. Standard Nodemailer SMTP
  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Bypass - Missing Credentials] Target: ${targetEmail} | Subject: ${subject}`);
    return { success: true, bypassed: true };
  }

  try {
    let resolvedHost = smtpHost;
    const isGmail = smtpHost.includes("gmail") || smtpUser.includes("@gmail.com");

    if (isGmail) {
      try {
        const addresses = await dns.promises.resolve4("smtp.gmail.com");
        if (addresses && addresses.length > 0) {
          resolvedHost = addresses[0];
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
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    console.log(`[Email Service] Attempting SMTP send to ${targetEmail} via ${smtpUser} (${resolvedHost}:465)...`);

    const info = await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Kyeto Chat" <${smtpUser}>`,
        to: targetEmail,
        subject,
        text: text || (html ? html.replace(/<[^>]*>?/gm, "") : ""),
        html,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP send connection timed out after 8s")), 8000)
      ),
    ]);

    console.log(`[Email Service Success] Delivered email to ${targetEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${targetEmail}:`, error.message || error);
    return {
      success: false,
      error: error.message || String(error),
      note: "On Cloud hosting like Render Free Tier, direct TCP SMTP ports (465/587) are often blocked by host cloud firewalls. Consider adding RESEND_API_KEY or BREVO_API_KEY in Render Environment Variables for 100% instant HTTPS delivery.",
    };
  }
};
