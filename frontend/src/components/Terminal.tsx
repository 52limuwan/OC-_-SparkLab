'use client';

import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  containerId?: string;
}

export default function Terminal({ containerId = 'default' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#000000',
        foreground: '#dfe4fe',
        cursor: '#a3a6ff',
        cursorAccent: '#070d1f',
        selectionBackground: 'rgba(163, 166, 255, 0.3)',
        black: '#070d1f',
        red: '#ff6e84',
        green: '#69f6b8',
        yellow: '#ffb148',
        blue: '#a3a6ff',
        magenta: '#8387ff',
        cyan: '#58e7ab',
        white: '#dfe4fe',
        brightBlack: '#41475b',
        brightRed: '#d73357',
        brightGreen: '#58e7ab',
        brightYellow: '#e79400',
        brightBlue: '#6063ee',
        brightMagenta: '#9396ff',
        brightCyan: '#69f6b8',
        brightWhite: '#faf8ff',
      },
      rows: 30,
      cols: 100,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const socket = io('http://localhost:4000/terminal', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('start', { containerId });
    });

    socket.on('ready', () => {
      xterm.writeln('\x1b[32mConnected to dev-env-01 via SSH-RSA-4096...\x1b[0m\r\n');
      xterm.writeln('\x1b[90mWelcome to DevLab v2.4.0-stable (GNU/Linux 5.15.0-generic x86_64)\x1b[0m\r\n');
      xterm.write('\x1b[32muser@devlab:~$\x1b[0m ');
    });

    socket.on('output', (data: string) => {
      xterm.write(data);
    });

    socket.on('error', (error: { message: string }) => {
      xterm.writeln(`\r\nError: ${error.message}\r\n`);
    });

    socket.on('exit', () => {
      xterm.writeln('\r\nTerminal session ended.\r\n');
    });

    xterm.onData((data) => {
      socket.emit('input', data);
    });

    const handleResize = () => {
      fitAddon.fit();
      socket.emit('resize', {
        rows: xterm.rows,
        cols: xterm.cols,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      xterm.dispose();
    };
  }, [containerId]);

  return (
    <div className="terminal-container h-full w-full bg-black overflow-hidden">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
