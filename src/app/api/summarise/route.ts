import { NextResponse, NextRequest } from 'next/server';

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

import { ChatOpenAI } from '@langchain/openai';

import sharp from 'sharp';

/**
 * Combined route to detect if content is an image (base64) or PDF text
 * and summarize accordingly.
 */
export async function POST(request: NextRequest) {
  try {
    const { emailContent } = await request.json();

    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { message: 'Invalid email content provided.' },
        { status: 400 }
      );
    }

    if (emailContent.startsWith('data:image/')) {
      const summary = await summarizeImage(emailContent);
      return NextResponse.json({ message: summary });
    } else {
      const summary = await summarizePdfText(emailContent);
      return NextResponse.json({ message: summary });
    }
  } catch (error: any) {
    console.error('Error summarizing:', error);
    return NextResponse.json(
      { message: 'An error occurred while summarizing the content.' },
      { status: 500 }
    );
  }
}

/**
 * Summarize an image (Base64) using AI's streaming approach or your existing method
 */
async function summarizeImage(base64Image: string): Promise<string> {
  const reducedImage = await reduceImageResolution(base64Image, 0.3);

  const result = await streamText({
    model: openai('gpt-4o-mini'), 
    system: `You are given an image to analyze. Provide a detailed description in the same language used in the image, or English if unclear.`,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please summarize the content of this image:' },
          { type: 'image', image: reducedImage },
        ],
      },
    ],
    maxTokens: 1000,
  });

  // 3) Collect streamed text
  let fullText = '';
  const reader = result.textStream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += value;
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

/**
 * Summarize PDF text (or any plain text) using LangChain + OpenAI
 */
async function summarizePdfText(pdfText: string): Promise<string> {
  // If you want to use GPT-4, or your custom model name "gpt-4o-mini":
  const chat = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const response = await chat.call([
    {
      role: 'system',
      content: 'You are a helpful assistant that summarizes PDF (or plain) text.',
    },
    {
      role: 'user',
      content: pdfText,
    },
  ]);

  return response.text.trim();
}

/**
 * Reduce image resolution using Sharp
 */
async function reduceImageResolution(base64Image: string, scale: number) {
  const base64Data = base64Image.split(',')[1];
  if (!base64Data) return base64Image; // If not well-formed, just return original

  const buffer = Buffer.from(base64Data, 'base64');
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Safely handle undefined or missing width/height
  const newWidth = Math.round((metadata.width ?? 0) * scale);
  const newHeight = Math.round((metadata.height ?? 0) * scale);

  if (!newWidth || !newHeight) {
    return base64Image;
  }

  // Resize and return new base64
  const resizedBuffer = await image.resize(newWidth, newHeight).toBuffer();
  return `data:image/${metadata.format};base64,${resizedBuffer.toString('base64')}`;
}
