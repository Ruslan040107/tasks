import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const tokens = useAuthStore.getState().tokens;
    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      auth: { token: tokens?.accessToken },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    const tokens = useAuthStore.getState().tokens;
    s.auth = { token: tokens?.accessToken };
    s.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
