import { getMailTransport, isEmailConfigured } from '@/lib/mail-transport';

export async function sendSignalEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) throw new Error('SMTP is not configured.');

  await getMailTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export { isEmailConfigured };
