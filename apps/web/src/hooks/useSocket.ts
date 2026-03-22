'use client';

import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(workspaceId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    if (workspaceId) {
      socket.emit('join_workspace', workspaceId);
    }

    return () => {
      if (workspaceId) {
        socket.emit('leave_workspace', workspaceId);
      }
    };
  }, [workspaceId]);

  return socketRef.current;
}

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  workspaceId?: string,
) {
  const socket = useSocket(workspaceId);

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
