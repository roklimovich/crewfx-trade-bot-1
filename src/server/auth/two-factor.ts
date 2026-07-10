import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = { window: 1 }; // allow 1 step of clock drift (±30s)

/** Generates a new TOTP secret for a user beginning 2FA enrollment (admin accounts only — see Phase 3 rules). */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/** Renders a scannable QR code (as a data URL) for authenticator apps. */
export async function generateTwoFactorQrCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, 'SignalForge', secret);
  return QRCode.toDataURL(otpauthUrl);
}

/** Verifies a 6-digit code the user typed against their stored secret. */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
