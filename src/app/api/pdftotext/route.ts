// app/api/pdftotext/route.ts

import { NextResponse, NextRequest } from 'next/server';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  console.log("Reached pdftotext route!");
  try {
    // Check if the request body is valid JSON:
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body is not valid JSON.' }, { status: 400 });
    }

    const { pdfUrl } = body;

    if (!pdfUrl || typeof pdfUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing pdfUrl.' },
        { status: 400 }
      );
    }

    const response = await fetch(pdfUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('pdf')) {
      return NextResponse.json({ error: 'Fetched content is not a PDF.' }, { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));

    return NextResponse.json({ text: data.text || 'No text found.' }, { status: 200 });
  } catch (err: any) {
    console.error('PDF parse error:', err);
    return NextResponse.json(
      { error: 'An error occurred while parsing the PDF.' },
      { status: 500 }
    );
  }
}
