import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { DisconnectReason } from 'socket.io';
import { allowedOrigins } from '../config/cors';
import { verifyToken } from '../utils/jwt';
import { User } from '../models';
import { JWTPayload } from '../types';

interface SocketUser {
  id: number;
  username: string;
  role: string;
}

interface ClientToServerEvents {}

interface PostRealtimePayload {
    post: unknown;
}

interface CommentRealtimePayload {
    comment: unknown;
}

interface ServerToClientEvents {
  'realtime:connected': (payload: { user?: SocketUser }) => void;
  'post:created': (payload: PostRealtimePayload) => void;
  'post:updated': (payload: PostRealtimePayload) => void;
  'post:deleted': (payload: { postId: number }) => void;
  'post:likeToggled': (payload: { postId: number; liked: boolean; userId: number }) => void;
  'comment:created': (payload: CommentRealtimePayload) => void;
  'comment:updated': (payload: CommentRealtimePayload) => void;
  'comment:deleted': (payload: { commentId: number; postId: number }) => void;
  'comment:moderated': (payload: {
    comment: unknown;
    actorId: number;
    action: 'approved' | 'rejected' | 'flagged';
  }) => void;
}

type InterServerEvents = Record<string, never>;

interface SocketData {
  user?: SocketUser;
}

type AuthenticatedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

const extractToken = (socket: AuthenticatedSocket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim().length > 0) {
    return authToken.trim();
  }

  const headerToken = socket.handshake.headers?.authorization;
  if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
    return headerToken.substring(7);
  }

  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken.trim().length > 0) {
    return queryToken.trim();
  }

  return null;
};

export const initSocket = (
  httpServer: HTTPServer
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  if (io) {
    return io;
  }

  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token = extractToken(socket);

      if (!token) {
        next(new Error('AUTHENTICATION_ERROR'));
        return;
      }

      const decoded: JWTPayload = verifyToken(token);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        next(new Error('AUTHENTICATION_ERROR'));
        return;
      }

      socket.data.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      next();
    } catch (error) {
      next(new Error('AUTHENTICATION_ERROR'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.info(`🔌 Cliente conectado ao realtime: ${socket.id}`);

    socket.emit('realtime:connected', {
      user: socket.data.user,
    });

    socket.on('disconnect', (reason: DisconnectReason) => {
      console.info(`🔌 Cliente ${socket.id} desconectado (${reason})`);
    });
  });

  return io;
};

export const getIO = (): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null =>
  io;
