import { createClient } from './server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

export async function getUser(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSchool(userId: string) {
  const supabase = createClient();
  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('user_id', userId)
    .single();
  return school;
}

export async function requireAuth(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return user;
}

export async function requireSetup(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return;

  const school = await getSchool(user.id);
  if (!school) {
    return NextResponse.redirect(new URL('/admin/school-profile', req.url));
  }
  
  if (!school.is_setup_complete && !req.nextUrl.pathname.startsWith('/admin/school-profile')) {
    return NextResponse.redirect(new URL('/admin/school-profile', req.url));
  }

  return school;
}

export type SchoolData = Database['public']['Tables']['schools']['Row'];
