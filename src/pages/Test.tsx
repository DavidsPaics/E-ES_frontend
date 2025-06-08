// src/pages/WSTestPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import Battery  from '@/components/battery';

const WS_URL = 'wss://izv.svaza.lv/ws';  // ← make sure this matches your server

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
      // accumulate incoming text
      setMessages(msgs => [...msgs, e.data]);
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
