import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

// Define setup steps in order
const SETUP_STEPS = {
  SCHOOL_PROFILE: '/admin/school-profile',
  ACADEMIC_YEAR: '/admin/setup/academic-year',
  TERMS: '/admin/setup/terms',
  CLASS_SECTIONS: '/admin/setup/class-sections',
  SUBJECTS: '/admin/setup/subjects',
};

// Define public paths that don't require auth
const PUBLIC_PATHS = ['/login', '/signup', '/reset-password'];
const BYPASS_AUTH_PATHS = ['/auth/callback'];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath));
}

function isBypassAuthPath(path: string): boolean {
  return BYPASS_AUTH_PATHS.some(bypassPath => path.startsWith(bypassPath));
}

function isSetupPath(path: string): boolean {
  return Object.values(SETUP_STEPS).some(step => path.startsWith(step));
}

// Get the next setup step based on database state
async function getNextSetupStep(supabase: any, userId: string): Promise<string> {
  try {
    // Check if school exists and get setup status
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, is_setup_complete')
      .eq('user_id', userId)
      .single();

    if (schoolError || !school) {
      return SETUP_STEPS.SCHOOL_PROFILE;
    }

    // Early return if setup is not complete
    if (!school.is_setup_complete) {
      // Check academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', school.id)
        .single();

      if (!academicYear) {
        return SETUP_STEPS.ACADEMIC_YEAR;
      }

      // Check terms
      const { data: terms } = await supabase
        .from('terms')
        .select('id')
        .eq('academic_year_id', academicYear.id);

      if (!terms?.length) {
        return SETUP_STEPS.TERMS;
      }

      // Check class sections
      const { data: sections } = await supabase
        .from('class_sections')
        .select('id')
        .eq('school_id', school.id);

      if (!sections?.length) {
        return SETUP_STEPS.CLASS_SECTIONS;
      }

      // Check subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('school_id', school.id);

      if (!subjects?.length) {
        return SETUP_STEPS.SUBJECTS;
      }

      // If all required data exists but setup is not marked complete
      await supabase
        .from('schools')
        .update({ is_setup_complete: true })
        .eq('id', school.id);
    }

    return '/admin/dashboard';
  } catch (error) {
    console.error('Error in getNextSetupStep:', error);
    return SETUP_STEPS.SCHOOL_PROFILE;
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Create a Supabase client with proper cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Check session
  const { data: { session } } = await supabase.auth.getSession();

  // Handle public routes
  if (isPublicPath(pathname)) {
    if (session) {
      const nextStep = await getNextSetupStep(supabase, session.user.id);
      return NextResponse.redirect(new URL(nextStep, request.url));
    }
    return response;
  }

  // Always allow auth callback to process
  if (isBypassAuthPath(pathname)) {
    return response;
  }

  // No session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For authenticated users, ensure they're on the correct setup step
  const nextStep = await getNextSetupStep(supabase, session.user.id);

  // Never allow access to dashboard if setup is not complete
  if (nextStep !== '/admin/dashboard' && pathname === '/admin/dashboard') {
    return NextResponse.redirect(new URL(nextStep, request.url));
  }

  // If on admin page but not on correct setup step
  if (pathname.startsWith('/admin') && pathname !== nextStep && !isSetupPath(pathname)) {
    return NextResponse.redirect(new URL(nextStep, request.url));
  }

  // If in setup flow but trying to skip steps
  if (isSetupPath(pathname) && pathname !== nextStep) {
    return NextResponse.redirect(new URL(nextStep, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
