
import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: NextRequest) {
  try {
    const { emailContent } = await request.json();

    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { message: 'Invalid email content provided.' },
        { status: 400 }
      );
    }

    // Initialize a LangChain Chat model (server-side)
    const chat = new ChatOpenAI({
      modelName: 'gpt-4o', // Ensure you have access to the model
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Setup prompt messages
    const messages = [
      {
        role: 'system',
        content: `
          You are a helpful assistant focusing on summarizing emails. Your task is to produce a concise yet complete summary that captures all critical points, requests, and relevant information from the email. Follow these guidelines:
          
          NOTE: if the email is only 20-30 words, you can simply repeat the email content as the summary.

          Length: Keep the summary brief (around 100–150 words), but make sure no key details are lost.
          
          Clarity and Organization:
          Begin with a one- or two-sentence overview stating the purpose of the email.
          Use bullet points or short paragraphs to highlight important points, requests, deadlines, or questions.
          
          Accuracy:
          Include every significant detail mentioned in the email without distorting its original meaning.
          Do not add new information or assume details not provided.
          
          Tone:
          Maintain a neutral, professional style.
          Avoid personal opinions, judgments, or extraneous commentary.
          
          Action Items and Next Steps:
          Clearly list any follow-up steps, responsibilities, or deadlines required by the sender.
          
          Concluding Statement:
          Wrap up with a brief closing line that summarizes the overall intention of the email (e.g., a request for a response, confirmation needed, or a reminder).
        `
      },
      {
        role: 'user',
        content: `Email Content:\n${emailContent}\n`,
      },
    ];

    // LangChain call
    const response = await chat.call(messages);
    const summary = response.text.trim(); // The assistant's output

    return NextResponse.json({ message: summary });
  } catch (error: any) {
    console.error('Error summarizing email:', error);
    return NextResponse.json(
      { message: 'An error occurred while summarizing the email.' },
      { status: 500 }
    );
  }
}
