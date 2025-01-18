import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmailApi';

export async function GET(req: NextRequest) {
  // Generate the Gmail OAuth URL
  const authUrl = getAuthUrl();

  // Return a NextResponse that redirects the user to the Google auth screen
  return NextResponse.redirect(authUrl);
}
