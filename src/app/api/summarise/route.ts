// route.ts
import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';


export async function POST(request: NextRequest) {
  try {
    let { emailContent } = await request.json();

    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { message: 'Invalid email content provided.' },
        { status: 400 }
      );
    }

    const chat = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please summarize this image:',
          },
          {
            type: 'image_url',
            image_url: { url: emailContent }, // Pass the full Data URI
          }
        ],
      },
    ];

    const response = await chat.call(messages);
    const summary = response.text.trim();

    return NextResponse.json({ message: summary });
  } catch (error: any) {
    console.error('Error summarizing email:', error);
    return NextResponse.json(
      { message: 'An error occurred while summarizing the email.' },
      { status: 500 }
    );
  }
}
