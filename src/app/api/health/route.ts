import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'AcademicOS',
    version: '1.0.0',
    time: new Date().toISOString(),
    integrations: {
      groq: Boolean(process.env.GROQ_API_KEY),
      drive: Boolean(process.env.GOOGLE_DRIVE_API_KEY),
      turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
      clerk: Boolean(process.env.CLERK_SECRET_KEY),
      supabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    credit: 'Web App Created By - Ayush Jha, 2CSE-4',
  });
}
