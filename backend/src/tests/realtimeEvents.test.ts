import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Response } from 'express';
import { Comment, Like, Post, User } from '../models';
import { createComment, approveComment } from '../controllers/commentController';
import { createPost, likePost } from '../controllers/postController';
import type { AuthenticatedRequest } from '../types';
import { getIO } from '../realtime/socket';

jest.mock('../realtime/socket', () => ({
  getIO: jest.fn(),
}));

const mockedGetIO = getIO as jest.MockedFunction<typeof getIO>;

const createMockResponse = () => {
  const data: { statusCode?: number; body?: unknown } = {};
  const partial: Partial<Response> = {};

  partial.status = ((code: number) => {
    data.statusCode = code;
    return partial as Response;
  }) as Response['status'];

  partial.json = ((payload: unknown) => {
    data.body = payload;
    return partial as Response;
  }) as Response['json'];

  return { res: partial as Response, data };
};

let sequence = 0;

const createUser = async (overrides: Partial<{ role: 'user' | 'moderator' | 'admin'; isActive: boolean }> = {}) => {
  sequence += 1;
  return User.create({
    username: `user-${sequence}`,
    email: `user-${sequence}@example.com`,
    password: 'Password123!',
    role: overrides.role ?? 'user',
    isActive: overrides.isActive ?? true,
  });
};

const createBlogPost = async (authorId: number) => {
  sequence += 1;
  return Post.create({
    title: `Post ${sequence}`,
    content: 'Post content',
    authorId,
    isPublished: true,
    publishedAt: new Date(),
  });
};

const createBlogComment = async (postId: number, authorId: number, status: 'pending' | 'approved' | 'rejected' | 'flagged' = 'pending') => {
  sequence += 1;
  return Comment.create({
    content: `Comment ${sequence}`,
    postId,
    authorId,
    status,
  });
};

const resetDatabase = async () => {
  await Like.destroy({ where: {}, truncate: true, force: true, cascade: true, restartIdentity: true } as any);
  await Comment.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  await Post.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  sequence = 0;
};

describe('Realtime events emitted by controllers', () => {
  beforeEach(async () => {
    await resetDatabase();
    mockedGetIO.mockReset();
  });

  it('emits comment:created when a comment is created', async () => {
    const emitMock = jest.fn();
    mockedGetIO.mockReturnValue({ emit: emitMock } as any);

    const author = await createUser();
    const post = await createBlogPost(author.id);

    const req = {
      body: {
        content: 'Hello world',
        postId: post.id,
      },
      user: {
        id: author.id,
        email: author.email,
        username: author.username,
        role: author.role,
      },
    } as unknown as AuthenticatedRequest;

    const { res } = createMockResponse();

    await createComment(req, res);

    expect(emitMock).toHaveBeenCalledWith(
      'comment:created',
      expect.objectContaining({
        comment: expect.objectContaining({
          content: 'Hello world',
          postId: post.id,
        }),
      })
    );
  });

  it('emits comment:moderated when a moderator approves a comment', async () => {
    const emitMock = jest.fn();
    mockedGetIO.mockReturnValue({ emit: emitMock } as any);

    const moderator = await createUser({ role: 'moderator' });
    const author = await createUser();
    const post = await createBlogPost(author.id);
    const comment = await createBlogComment(post.id, author.id, 'flagged');

    const req = {
      params: { id: String(comment.id) },
      body: { reason: 'Tudo certo' },
      user: {
        id: moderator.id,
        email: moderator.email,
        username: moderator.username,
        role: moderator.role,
      },
    } as unknown as AuthenticatedRequest;

    const { res } = createMockResponse();

    await approveComment(req, res);

    expect(emitMock).toHaveBeenCalledWith(
      'comment:moderated',
      expect.objectContaining({
        actorId: moderator.id,
        action: 'approved',
        comment: expect.objectContaining({ id: comment.id }),
      })
    );
  });

  it('emits post:created when a post is created', async () => {
    const emitMock = jest.fn();
    mockedGetIO.mockReturnValue({ emit: emitMock } as any);

    const author = await createUser();

    const req = {
      body: {
        title: 'My new post',
        content: 'Body',
        excerpt: 'Body',
        imageUrl: null,
        tags: ['news'],
      },
      user: {
        id: author.id,
        email: author.email,
        username: author.username,
        role: author.role,
      },
    } as unknown as AuthenticatedRequest;

    const { res } = createMockResponse();

    await createPost(req, res);

    expect(emitMock).toHaveBeenCalledWith(
      'post:created',
      expect.objectContaining({
        post: expect.objectContaining({
          title: 'My new post',
          authorId: author.id,
        }),
      })
    );
  });

  it('emits post:likeToggled when a post is liked', async () => {
    const emitMock = jest.fn();
    mockedGetIO.mockReturnValue({ emit: emitMock } as any);

    const author = await createUser();
    const post = await createBlogPost(author.id);
    const liker = await createUser();

    const req = {
      params: { id: String(post.id) },
      user: {
        id: liker.id,
        email: liker.email,
        username: liker.username,
        role: liker.role,
      },
    } as unknown as AuthenticatedRequest;

    const { res } = createMockResponse();

    await likePost(req, res);

    expect(emitMock).toHaveBeenCalledWith(
      'post:likeToggled',
      expect.objectContaining({
        postId: post.id,
        liked: true,
        userId: liker.id,
      })
    );
  });
});
