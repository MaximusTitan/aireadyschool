import { resend } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, schoolName } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Data & AI Talks <dat@aireadyschool.com>',
      to: [email],
      subject: `Thank you for your interest in Data & AI Talks, ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <img src="https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//DATlogo.avif" alt="Data & AI Talks Logo" style="max-width: 200px; height: auto;">
          </div>
          
          <h2 style="color: #e42467;">Thank You for Registering!</h2>
          <p>Dear ${name},</p>
          <p>Thank you for registering ${schoolName || 'your school'} for Data & AI Talks. We appreciate your interest and will get back to you shortly.</p>
          <p>In the meantime, if you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Data & AI Talks Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e42467; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AI Ready School. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
