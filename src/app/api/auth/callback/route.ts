import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/gmailApi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    // 1. Exchange the auth code for tokens
    const tokens = await getTokens(code);
    
    // 2. Optionally log them (for debugging):
    console.log("Tokens:", tokens);

    // 3. Redirect back to the same page with a query parameter
    //    You can check this parameter in your OnboardingPage (via `useEffect`) to update UI
    return NextResponse.redirect(new URL('/CogniC_Inquiry/?gmailConnected=true', req.url));
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
}
