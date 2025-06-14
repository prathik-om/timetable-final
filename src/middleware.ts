import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Auth routes handling
  if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
    if (session) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return res;
  }

  // Admin routes handling
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Get user role from session
    const { data: { user } } = await supabase.auth.getUser();
    const userRole = user?.user_metadata?.role;

    // Check if user is an admin
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // For school-specific routes, check if user has a school
    if (req.nextUrl.pathname.startsWith('/admin/teaching-assignments') ||
        req.nextUrl.pathname.startsWith('/admin/teachers') ||
        req.nextUrl.pathname.startsWith('/admin/rooms')) {
      
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!school) {
        return NextResponse.redirect(new URL('/admin/school-profile', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/admin/:path*',
  ],
}; 