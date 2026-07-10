import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(2).max(80).optional(),
  referralCode: z.string().optional(), // maps to referredById lookup
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorToken: z.string().length(6).optional(), // required for admin accounts with 2FA enabled
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(10),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32),
});

export const submitPocketOptionSchema = z.object({
  accountId: z.string().min(3).max(64),
});

export const telegramLoginSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

export const twoFactorVerifySchema = z.object({
  token: z.string().length(6),
});
