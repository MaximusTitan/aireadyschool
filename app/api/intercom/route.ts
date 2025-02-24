import { createHash, createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const secretKey = process.env.INTERCOM_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const hmac = createHmac('sha256', secretKey)
      .update(user.id)
      .digest('hex');

    return NextResponse.json({ 
      userHash: hmac,
      userId: user.id  // Return user ID to ensure consistency
    });

  } catch (error) {
    console.error('Error generating Intercom HMAC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
