import { NextResponse } from 'next/server';
import { adminCreateCourse } from '@/core/application/courses';
import { getCurrentUser, isAdmin } from '@/core/application/session';

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const course = adminCreateCourse(body);
  return NextResponse.json({ id: course.id, course });
}
