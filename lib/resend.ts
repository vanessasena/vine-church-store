import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';

export const resend = new Resend(resendApiKey);

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vinechurch.com';
