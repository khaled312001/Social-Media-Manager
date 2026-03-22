'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '' },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => console.log('WebSocket connected'));
    socket.on('disconnect', () => console.log('WebSocket disconnected'));
    socket.on('connect_error', (err) => console.error('WebSocket error:', err));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function joinWorkspace(workspaceId: string) {
  getSocket().emit('join_workspace', { workspaceId });
}
