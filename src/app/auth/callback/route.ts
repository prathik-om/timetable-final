import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);

      // Get the session to verify it worked
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session after exchange');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check if school exists and its setup status
      const { data: school } = await supabase
        .from('schools')
        .select('is_setup_complete')
        .eq('user_id', session.user.id)
        .single();

      if (!school) {
        // User needs to create a school profile first
        return NextResponse.redirect(new URL('/admin/school-profile', request.url));
      }

      if (!school.is_setup_complete) {
        // Send to the next setup step
        return NextResponse.redirect(new URL('/admin/setup/academic-year', request.url));
      }

      // Setup is complete, go to dashboard
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    throw new Error('No code in query string');
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
