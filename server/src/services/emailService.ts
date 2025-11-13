import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Ustvari transporter za pošiljanje emailov
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Pošlje email
 * V development modu pošlje vse emaile na testni email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Za testiranje vedno pošljemo na testni email
    const actualRecipient = env.emailTestRecipient;
    
    console.log(`📧 Sending email to ${actualRecipient} (original recipient: ${options.to})`);
    console.log(`   Subject: ${options.subject}`);
    
    const mailOptions = {
      from: `WiiFit <${env.emailUser}>`,
      to: actualRecipient,
      subject: options.subject,
      text: options.text + `\n\n---\n(Original recipient would be: ${options.to})`,
      html: options.html 
        ? options.html + `<hr><p style="color: #888; font-size: 12px;">(Original recipient would be: ${options.to})</p>`
        : undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Pošlje opomnik za skupinsko vadbo
 */
export async function sendClassReminder(
  recipientEmail: string,
  recipientName: string,
  className: string,
  classDate: Date,
  startTime: string,
  endTime: string,
  trainerName?: string
): Promise<void> {
  const formattedDate = classDate.toLocaleDateString("sl-SI", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Opomnik: ${className} - ${formattedDate}`;
  
  const text = `
Pozdravljeni ${recipientName},

To je opomnik za vašo rezervacijo skupinske vadbe:

Vadba: ${className}
Datum: ${formattedDate}
Čas: ${startTime} - ${endTime}
${trainerName ? `Trener: ${trainerName}` : ""}

Prosimo, da pridete 5-10 minut pred začetkom vadbe.

Če ne morete priti, prosimo preklicajte rezervacijo v aplikaciji, da lahko mesto dodelimo drugim.

Lep pozdrav,
WiiFit ekipa
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .detail { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
    .detail-label { font-weight: bold; color: #667eea; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ Opomnik za vadbo</h1>
    </div>
    <div class="content">
      <p>Pozdravljeni <strong>${recipientName}</strong>,</p>
      <p>To je opomnik za vašo rezervacijo skupinske vadbe:</p>
      
      <div class="detail">
        <div class="detail-label">📋 Vadba:</div>
        <div>${className}</div>
      </div>
      
      <div class="detail">
        <div class="detail-label">📅 Datum:</div>
        <div>${formattedDate}</div>
      </div>
      
      <div class="detail">
        <div class="detail-label">🕐 Čas:</div>
        <div>${startTime} - ${endTime}</div>
      </div>
      
      ${trainerName ? `
      <div class="detail">
        <div class="detail-label">👤 Trener:</div>
        <div>${trainerName}</div>
      </div>
      ` : ""}
      
      <p style="margin-top: 20px;">
        <strong>Pomembno:</strong> Prosimo, da pridete 5-10 minut pred začetkom vadbe.
      </p>
      
      <p>
        Če ne morete priti, prosimo preklicajte rezervacijo v aplikaciji, 
        da lahko mesto dodelimo drugim članom.
      </p>
      
      <div class="footer">
        <p>Lep pozdrav,<br><strong>WiiFit ekipa</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: recipientEmail,
    subject,
    text,
    html,
  });
}
