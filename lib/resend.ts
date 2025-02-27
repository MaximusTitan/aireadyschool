import { Resend } from 'resend';

// Create a new Resend client with API key from environment variable
export const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
