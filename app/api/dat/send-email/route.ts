import { resend } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = 'chiranjeevi@igebra.ai';

export async function POST(request: NextRequest) {
  try {
    const { email, name, schoolName, ...schoolDetails } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Send email to school
    const userEmailResult = await resend.emails.send({
      from: 'Data & AI Talks <dat@aireadyschool.com>',
      to: [email],
      subject: `Thank you for your interest in Data & AI Talks, ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <img src="https://bqoejhpojkztpizeqjcr.supabase.co/storage/v1/object/public/student-photos/dat%20logo/DATlogo.avif" alt="Data & AI Talks Logo" style="max-width: 200px; height: auto;">
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

    // Send detailed email to admin
    const adminEmailResult = await resend.emails.send({
      from: 'Data & AI Talks <dat@aireadyschool.com>',
      to: [ADMIN_EMAIL],
      subject: `New School Registration: ${schoolName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <img src="https://bqoejhpojkztpizeqjcr.supabase.co/storage/v1/object/public/student-photos/dat%20logo/DATlogo.avif" alt="Data & AI Talks Logo" style="max-width: 200px; height: auto;">
          </div>
          
          <h2 style="color: #e42467;">New School Registration</h2>
          <p>A new school has registered for Data & AI Talks.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #e42467; margin-top: 0;">School Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>School Name:</strong> ${schoolName}</li>
              <li><strong>Contact Person:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${schoolDetails.phone}</li>
              <li><strong>Designation:</strong> ${schoolDetails.designation}</li>
              <li><strong>Website:</strong> ${schoolDetails.websiteAddress}</li>
              <li><strong>Education Board:</strong> ${schoolDetails.educationBoard}</li>
              <li><strong>Working Computers:</strong> ${schoolDetails.computers}</li>
              <li><strong>Total Children (5-12):</strong> ${schoolDetails.totalChildren}</li>
              <li><strong>Area:</strong> ${schoolDetails.area}</li>
              <li><strong>City:</strong> ${schoolDetails.city}</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e42467; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AI Ready School. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (userEmailResult.error || adminEmailResult.error) {
      console.error('Error sending email:', userEmailResult.error || adminEmailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
