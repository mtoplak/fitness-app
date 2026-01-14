import nodemailer from "nodemailer";
import { encode } from "he";
import { env } from "../config/env.js";

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
    const actualRecipient = env.emailTestRecipient;
    
    console.log(`📧 Sending email to ${actualRecipient} (original recipient: ${options.to})`);
    console.log(`   Subject: ${options.subject}`);
    
    const mailOptions = {
      from: `WiiFit <${env.emailUser}>`,
      to: actualRecipient,
      subject: encode(options.subject),
      text: options.text + `\n\n---\n(Original recipient would be: ${options.to})`,
      html: options.html 
        ? options.html + `<hr><p style="color: #888; font-size: 12px;">(Original recipient would be: ${encode(options.to)})</p>`
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

/**
 * Pošlje obvestilo adminu o novi skupinski vadbi
 */
export async function sendNewClassNotificationToAdmin(classData: {
  className: string;
  trainerName: string;
  trainerEmail: string;
  description?: string;
  capacity?: number;
  schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}): Promise<void> {
  const daysOfWeek = ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"];
  
  const scheduleText = classData.schedule
    .map(slot => `${daysOfWeek[slot.dayOfWeek]} ${slot.startTime} - ${slot.endTime}`)
    .join("\n");

  const isUpdate = classData.className.includes("(POSODOBLJENA)");
  const cleanClassName = classData.className.replace(" (POSODOBLJENA)", "");

  const subject = `${isUpdate ? "Posodobljena" : "Nova"} skupinska vadba zahteva odobritev: ${cleanClassName}`;
  
  const text = `
${isUpdate ? "Posodobljena" : "Nova"} skupinska vadba čaka na odobritev

Ime vadbe: ${cleanClassName}
${isUpdate ? "STATUS: Posodobljena - potrebna ponovna odobritev" : ""}
Trener: ${classData.trainerName} (${classData.trainerEmail})
Opis: ${classData.description || "Ni opisa"}
Kapaciteta: ${classData.capacity || "Ni določena"} udeležencev

Urnik:
${scheduleText}

Prijavite se v admin nadzorno ploščo za pregled in odobritev vadbe.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .detail { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f5576c; }
    .detail-label { font-weight: bold; color: #f5576c; }
    .schedule { background: white; padding: 15px; margin: 10px 0; font-family: monospace; white-space: pre-line; }
    .btn { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isUpdate ? '🔄 Posodobljena vadba čaka na odobritev' : '⚠️ Nova vadba čaka na odobritev'}</h1>
    </div>
    <div class="content">
      ${isUpdate ? '<p><strong style="color: #f5576c;">⚠️ Ta vadba je bila posodobljena in potrebuje ponovno odobritev.</strong></p>' : ''}
      <p>Trener je ${isUpdate ? 'posodobil' : 'ustvaril'} skupinsko vadbo, ki čaka na vašo odobritev.</p>
      
      <h3>Podrobnosti vadbe:</h3>
      
      <div class="detail">
        <div class="detail-label">📋 Ime vadbe:</div>
        <div>${cleanClassName}</div>
      </div>
      
      <div class="detail">
        <div class="detail-label">👤 Trener:</div>
        <div>${classData.trainerName} (${classData.trainerEmail})</div>
      </div>
      
      <div class="detail">
        <div class="detail-label">📝 Opis:</div>
        <div>${classData.description || "Ni opisa"}</div>
      </div>
      
      <div class="detail">
        <div class="detail-label">👥 Kapaciteta:</div>
        <div>${classData.capacity || "Ni določena"} udeležencev</div>
      </div>
      
      <h3>Urnik:</h3>
      <div class="schedule">${scheduleText}</div>
      
      <p style="text-align: center;">
        <a href="${env.clientOrigin}/dashboard" class="btn">Pojdi na nadzorno ploščo</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: "admin@wiifit.si",
    subject,
    text,
    html,
  });
}

/**
 * Pošlje obvestilo trenerju o statusu vadbe
 */
export async function sendClassStatusNotificationToTrainer(
  trainerEmail: string,
  classData: {
    className: string;
    status: "approved" | "rejected";
    adminComment?: string;
  }
): Promise<void> {
  const isApproved = classData.status === "approved";
  
  const subject = `Vadba ${classData.className} - ${isApproved ? "Odobrena" : "Zavrnjena"}`;
  
  const text = `
Vaša skupinska vadba je bila ${isApproved ? "odobrena" : "zavrnjena"}

Ime vadbe: ${classData.className}
Status: ${isApproved ? "Odobrena" : "Zavrnjena"}
${classData.adminComment ? `Komentar: ${classData.adminComment}` : ""}

${isApproved 
  ? "Čestitamo! Vaša vadba je zdaj vidna članom in je na voljo za rezervacije." 
  : "Prosimo, preglejte podrobnosti vadbe in jo po potrebi uredite ter ponovno pošljite na odobritev."
}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isApproved ? 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)' : 'linear-gradient(135deg, #e53935 0%, #e35d5b 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .detail { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${isApproved ? '#96c93d' : '#e35d5b'}; }
    .detail-label { font-weight: bold; color: ${isApproved ? '#96c93d' : '#e35d5b'}; }
    .btn { display: inline-block; padding: 12px 24px; background: ${isApproved ? '#96c93d' : '#e35d5b'}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isApproved ? '✅ Vadba odobrena' : '❌ Vadba zavrnjena'}</h1>
    </div>
    <div class="content">
      <div class="detail">
        <div class="detail-label">📋 Ime vadbe:</div>
        <div>${classData.className}</div>
      </div>
      
      <div class="detail">
        <div class="detail-label">Status:</div>
        <div><strong>${isApproved ? '✅ Odobrena' : '❌ Zavrnjena'}</strong></div>
      </div>
      
      ${classData.adminComment ? `
      <div class="detail">
        <div class="detail-label">💬 Komentar administratorja:</div>
        <div>${classData.adminComment}</div>
      </div>
      ` : ''}
      
      <p>
        ${isApproved 
          ? 'Čestitamo! Vaša vadba je zdaj vidna članom in je na voljo za rezervacije.' 
          : 'Prosimo, preglejte podrobnosti vadbe in jo po potrebi uredite ter ponovno pošljite na odobritev.'
        }
      </p>
      
      <p style="text-align: center;">
        <a href="${env.clientOrigin}/dashboard" class="btn">Pojdi na nadzorno ploščo</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: trainerEmail,
    subject,
    text,
    html,
  });
}
