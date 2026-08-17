import { getMailTransport } from './mail-transport';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${appUrl}/verify-email?token=${token}`;
  await getMailTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verify your CrewFX email',
    html: `<p>Confirm your email to activate your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${appUrl}/reset-password?token=${token}`;
  await getMailTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your CrewFX password',
    html: `<p>Reset your password using the link below:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email. This link expires in 1 hour.</p>`,
  });
}
