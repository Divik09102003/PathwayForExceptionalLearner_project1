// page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { pdfToText } from 'pdf-ts';
import dynamic from 'next/dynamic';

// Dynamically import both `react-markdown` and `remark-gfm`
const ReactMarkdownWithGfm = dynamic(async () => {
  const [ReactMarkdown, remarkGfm] = await Promise.all([
    import('react-markdown'),
    import('remark-gfm'),
  ]);

  const MarkdownComponent = (props: any) => (
    <ReactMarkdown.default {...props} remarkPlugins={[remarkGfm.default]} />
  );
  MarkdownComponent.displayName = 'MarkdownComponent';
  return MarkdownComponent;
}, { ssr: false });

const initialMockMessages = {
  Inbox: [
    {
      id: 1,
      subject: 'Text Email (Markdown)',
      from: 'john@example.com',
      body: `
        
      `,
    },
    {
      id: 2,
      subject: 'Assessment Requirements',
      from: 'susan@example.com',
      body: (
        <embed
          src="/test-image.png"
          type="image/png"
          width="500"
          height="400"
        />
      ),
    },
    {
      id: 3,
      subject: 'Module 1 Tutorial (PDF)',
      from: 'alex@example.com',
      body: (
        <embed
          src="/Module1TutorialQuestion.pdf"
          type="application/pdf"
          width="500"
          height="400"
        />
      ),
    },
  ],
  Drafts: [],
  'Sent Items': [],
};

export default function HomePage() {
  const [folderData, setFolderData] = useState(initialMockMessages);
  const [selectedFolder, setSelectedFolder] = useState<keyof typeof initialMockMessages>('Inbox');
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages(folderData[selectedFolder] || []);
    setSelectedMessage(null);
    setSummary('');
  }, [folderData, selectedFolder]);

  const handleFolderClick = (folderName: keyof typeof initialMockMessages) => {
    setSelectedFolder(folderName);
  };

  const handleMessageClick = async (message: any) => {
    setSelectedMessage(message);
    setSummary('');
    setLoading(true);

    try {
      let textToSummarize = '';

      // Check if message body is a string (plaintext/markdown)
      if (typeof message.body === 'string') {
        textToSummarize = message.body;

      // Otherwise, check if it's an <embed> element (PDF or image)
      } else if (
        React.isValidElement(message.body) &&
        message.body.type === 'embed'
      ) {
        const src: string = message.body.props.src;
        // Construct a fully qualified URL if needed
        const srcUrl = src.startsWith('http') ? src : `${window.location.origin}${src}`;

        // Handle PDF files
        if (message.body.props.type === 'application/pdf') {
          const response = await fetch(srcUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch PDF file.');
          }
          const pdfArrayBuffer = await response.arrayBuffer();
          const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
          textToSummarize = await pdfToText(pdfUint8Array);

        // Handle PNG/JPEG by converting to Base64
        } else if (
          message.body.props.type === 'image/png' ||
          message.body.props.type === 'image/jpeg' ||
          message.body.props.type === 'image/jpg'
        ) {
          // First fetch the image as a blob to avoid CORS issues
          const response = await fetch(srcUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          const imageBlob = await response.blob();
          textToSummarize = await convertBlobToBase64(imageBlob);
        } else {
          setSummary('Unsupported content type.');
          setLoading(false);
          return;
        }
      } else {
        setSummary('Unsupported content type.');
        setLoading(false);
        return;
      }

      // Now we have the extracted text (PDF or Image), send it to our /api/summarise route
      const res = await fetch('/api/summarise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: textToSummarize }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await res.json();
      setSummary(data.message);
    } catch (error: any) {
      console.error('Error processing message:', error);
      setSummary(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  async function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <aside
        style={{
          width: '250px',
          borderRight: '1px solid #ccc',
          padding: '1rem',
        }}
      >
        <h2>Mail Folders</h2>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {Object.keys(folderData).map((folder) => (
            <li
              key={folder}
              onClick={() => handleFolderClick(folder as keyof typeof initialMockMessages)}
              style={{
                padding: '0.5rem 0',
                cursor: 'pointer',
                fontWeight: selectedFolder === folder ? 'bold' : 'normal',
              }}
            >
              {folder}
            </li>
          ))}
        </ul>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <section
            style={{
              width: '300px',
              borderRight: '1px solid #ccc',
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            <h2>{selectedFolder} Messages</h2>
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleMessageClick(msg)}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: selectedMessage?.id === msg.id ? '#ddd' : '#f9f9f9',
                  cursor: 'pointer',
                }}
              >
                <p><strong>Subject:</strong> {msg.subject}</p>
                <p><strong>From:</strong> {msg.from}</p>
              </div>
            ))}
          </section>

          <section style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            {loading ? (
              <p>Processing...</p>
            ) : selectedMessage ? (
              <>
                {summary && (
                  <div
                    style={{
                      backgroundColor: '#f0f8ff',
                      padding: '0.5rem',
                      marginBottom: '1rem',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <strong>Email Summary:</strong>
                    <ReactMarkdownWithGfm>{summary}</ReactMarkdownWithGfm>
                  </div>
                )}

                <h2>{selectedMessage.subject}</h2>
                <p><strong>From:</strong> {selectedMessage.from}</p>
                <hr />

                {typeof selectedMessage.body === 'string' ? (
                  <ReactMarkdownWithGfm>{selectedMessage.body}</ReactMarkdownWithGfm>
                ) : (
                  selectedMessage.body
                )}
              </>
            ) : (
              <p>Select a message to read.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
