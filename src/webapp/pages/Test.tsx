// src/pages/WSTestPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import Battery  from '@/webapp/components/battery';
import { ENDPOINT_WS_LIVE } from '@/webapp/config/endpoints';

const WS_URL = ENDPOINT_WS_LIVE;  // Use centralized endpoint

export const WSTestPage: React.FC = () => {
  const [status, setStatus]       = useState('Connecting…');
  const [messages, setMessages]   = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus(`✅ Connected to ${WS_URL}`);
    };

    ws.onmessage = (e: MessageEvent) => {
      // Try to pretty-print JSON, otherwise show as text
      let msg: string;
      try {
        const parsed = JSON.parse(e.data);
        msg = JSON.stringify(parsed, null, 2);
      } catch {
        msg = e.data;
      }
      setMessages(msgs => [...msgs, msg]);
    };

    ws.onerror = () => {
      setStatus('⚠️ WebSocket error');
    };

    ws.onclose = () => {
      setStatus('⛔ Disconnected');
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>React WebSocket Test</h1>
              <Battery voltage={34} />
      <div><strong>Status:</strong> {status}</div>
      <div style={{
        marginTop: 10,
        padding: 10,
        background: '#f9f9f9',
        height: '60vh',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        border: '1px solid #ddd'
      }}>
        {messages.length === 0
          ? <em>No messages yet…</em>
          : messages.map((m, i) => <div key={i}>{m}</div>)
        }
      </div>
    </div>
  );
};

export default WSTestPage;
