import nodemailer from 'nodemailer';

let cachedTransport: nodemailer.Transporter | null = null;

export function getMailTransport(): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  return cachedTransport;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}
