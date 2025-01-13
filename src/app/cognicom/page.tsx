// app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { ChatOpenAI } from "@langchain/openai";
import Image from "next/image";

// Mock message data
const initialMockMessages = {
  Inbox: [
    {
      id: 1,
      subject: 'Text Email',
      from: 'john@example.com',
      body: `
        Hi Team,

        I wanted to update you on the project status. We have completed the initial phase and are moving into development. Please ensure all documentation is up-to-date by end of this week.

        Best,
        John
      `
    },
    {
      id: 2,
      subject: 'Module 1 Tutorial Question (PDF)',
      from: 'susan@example.com',
      // Embed the PDF
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

    // CASE 1: If the body is a string -> Summarize text via /api/summarize
    if (typeof message.body === 'string') {
      try {
        console.log('Making request to /api/summarise...');
        const res = await fetch('/api/summarise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailContent: message.body }),
        });
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          throw new Error('Failed to fetch summary');
        }
        const data = await res.json();
        console.log('Received data:', data);
        setSummary(data.message);
      } catch (error) {
        console.error('Error in API call:', error);
        setSummary('Error generating summary.');
      }

    // CASE 2: If the body is an <embed type="application/pdf"> -> call /api/pdftotext
    } else if (
      React.isValidElement(message.body) &&
      message.body.type === 'embed' &&
      message.body.props.type === 'application/pdf'
    ) {
      try {
        const pdfSrc: string = message.body.props.src;
        // Construct absolute URL if not fully qualified
        const pdfUrl = pdfSrc.startsWith('http')
          ? pdfSrc
          : `${window.location.origin}${pdfSrc}`;

        const res = await fetch('/api/pdftotext', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to parse PDF');
        }

        const data = await res.json();

        if (data.text && data.text.trim()) {
          setSummary(data.text);
        } else {
          setSummary('No text found in the PDF (possibly a scanned document).');
        }
      } catch (error: any) {
        console.error('PDF parse error:', error);
        setSummary(error.message || 'Error processing PDF.');
      }

    } else {
      setSummary('Unsupported content type.');
    }

    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          borderRight: '1px solid #ccc',
          padding: '1rem',
          boxSizing: 'border-box',
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

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <section
            style={{
              width: '300px',
              borderRight: '1px solid #ccc',
              padding: '1rem',
              boxSizing: 'border-box',
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
                {/* Show summary if present */}
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
                    <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
                  </div>
                )}
                <h2>{selectedMessage.subject}</h2>
                <p><strong>From:</strong> {selectedMessage.from}</p>
                <hr />
                <div>
                  {typeof selectedMessage.body === 'string'
                    ? <p style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.body}</p>
                    : selectedMessage.body}
                </div>
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


