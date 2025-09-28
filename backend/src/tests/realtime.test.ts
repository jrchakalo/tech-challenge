import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { createServer, Server as HTTPServer } from 'http';
import { initSocket, getIO } from '../realtime/socket';

describe('Realtime socket initialization', () => {
  let httpServer: HTTPServer;

  beforeAll(async () => {
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(0, resolve);
    });
  });

  afterAll(async () => {
    const io = getIO();
    if (io) {
      await new Promise<void>((resolve) => {
        io.close(() => resolve());
      });
    }

    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  it('initializes Socket.IO server only once', () => {
    const firstInstance = initSocket(httpServer);
    const secondInstance = initSocket(httpServer);

    expect(firstInstance).toBe(secondInstance);
    expect(getIO()).toBe(firstInstance);
  });
});
