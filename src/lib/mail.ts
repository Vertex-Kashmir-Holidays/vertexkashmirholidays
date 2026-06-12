import nodemailer from "nodemailer";

function createTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const from =
    process.env.MAIL_FROM ??
    "Vertex Kashmir Holidays <hello@vertexkashmirholidays.com>";

  const transporter = createTransporter();

  if (!transporter) {
    console.log("[mail:dev] →", options.to, "|", options.subject);
    console.log("[mail:dev]", options.html.replace(/<[^>]+>/g, " ").trim());
    return;
  }

  await transporter.sendMail({ from, ...options });
}

// ── Reusable email builders ──────────────────────────────────────────────────

export function inquiryNotificationHtml(data: {
  name: string;
  phone: string;
  email?: string;
  travelDate?: string;
  travellers?: number;
  message?: string;
  source?: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0f3460">New Inquiry — Vertex Kashmir Holidays</h2>
      <table cellpadding="8" style="width:100%;border-collapse:collapse">
        <tr><td><strong>Name</strong></td><td>${data.name}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${data.phone}</td></tr>
        ${data.email ? `<tr><td><strong>Email</strong></td><td>${data.email}</td></tr>` : ""}
        ${data.travelDate ? `<tr><td><strong>Travel Date</strong></td><td>${data.travelDate}</td></tr>` : ""}
        ${data.travellers ? `<tr><td><strong>Travellers</strong></td><td>${data.travellers}</td></tr>` : ""}
        ${data.message ? `<tr><td><strong>Message</strong></td><td>${data.message}</td></tr>` : ""}
        ${data.source ? `<tr><td><strong>Source</strong></td><td>${data.source}</td></tr>` : ""}
      </table>
    </div>`;
}

export function bookingConfirmationHtml(data: {
  guestName: string;
  tourTitle: string;
  amount: number;
  travelDate: string;
  travellers: number;
  razorpayPayId: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0f3460">Booking Confirmed — Vertex Kashmir Holidays</h2>
      <p>Dear ${data.guestName}, your booking is confirmed!</p>
      <table cellpadding="8" style="width:100%;border-collapse:collapse">
        <tr><td><strong>Tour</strong></td><td>${data.tourTitle}</td></tr>
        <tr><td><strong>Travel Date</strong></td><td>${data.travelDate}</td></tr>
        <tr><td><strong>Travellers</strong></td><td>${data.travellers}</td></tr>
        <tr><td><strong>Amount Paid</strong></td><td>₹${data.amount.toLocaleString("en-IN")}</td></tr>
        <tr><td><strong>Payment ID</strong></td><td>${data.razorpayPayId}</td></tr>
      </table>
      <p style="margin-top:16px">Our team will contact you within 24 hours with your complete itinerary details.</p>
      <p>WhatsApp us: <a href="https://wa.me/${process.env.MAIL_TO_ADMIN ?? "919419000000"}">+91 94190 00000</a></p>
    </div>`;
}
