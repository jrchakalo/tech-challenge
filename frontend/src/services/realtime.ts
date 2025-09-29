import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let socket: Socket | null = null;

const resolveSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/?api\/?$/, '');
};

export const getRealtimeSocket = (): Socket | null => socket;

export const connectRealtime = (): Socket | null => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  if (!socket) {
    socket = io(resolveSocketUrl(), {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: false,
    });
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectRealtime = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const subscribeToEvent = <T>(eventName: string, handler: (payload: T) => void) => {
  if (!socket) {
    return () => {};
  }

  socket.on(eventName, handler);
  return () => {
    socket?.off(eventName, handler);
  };
};
