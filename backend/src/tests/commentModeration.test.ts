import { beforeEach, describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Comment, Post, User } from '../models';
import commentsRouter from '../routes/comments';
import { generateToken } from '../utils/jwt';

let sequence = 0;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/comments', commentsRouter);
  return app;
};

const createUser = async (overrides: Partial<{ role: 'user' | 'moderator' | 'admin'; isActive: boolean }> = {}) => {
  sequence += 1;
  return User.create({
    username: `user${sequence}`,
    email: `user${sequence}@example.com`,
    password: 'Password123!',
    role: overrides.role ?? 'user',
    isActive: overrides.isActive ?? true,
  });
};

const createPost = async (authorId: number) => {
  sequence += 1;
  return Post.create({
    title: `Sample Post ${sequence}`,
    content: 'Post content',
    authorId,
    isPublished: true,
  });
};

const createComment = async (
  overrides: Partial<{
    content: string;
    postId: number;
    authorId: number;
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    moderatedBy: number | null;
    moderatedAt: Date | null;
    moderationNotes: string | null;
    flaggedBy: number | null;
    flaggedAt: Date | null;
  }>
) => {
  if (!overrides?.postId || !overrides?.authorId) {
    throw new Error('postId and authorId must be provided to create a comment');
  }

  sequence += 1;
  return Comment.create({
    content: overrides.content ?? `Comment ${sequence}`,
    postId: overrides.postId,
    authorId: overrides.authorId,
    status: overrides.status ?? 'pending',
    moderatedBy: overrides.moderatedBy ?? null,
    moderatedAt: overrides.moderatedAt ?? null,
    moderationNotes: overrides.moderationNotes ?? null,
    flaggedBy: overrides.flaggedBy ?? null,
    flaggedAt: overrides.flaggedAt ?? null,
  });
};

describe('Comment moderation flow', () => {
  beforeEach(async () => {
    await Comment.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await Post.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    sequence = 0;
  });

  it('should only return approved comments to anonymous users', async () => {
    const author = await createUser();
    const post = await createPost(author.id);
    await createComment({ postId: post.id, authorId: author.id, status: 'approved' });
    await createComment({ postId: post.id, authorId: author.id, status: 'pending' });

    const app = buildApp();
    const response = await request(app).get(`/comments/post/${post.id}`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].status).toBe('approved');
  });

  it('should allow moderators to retrieve pending comments', async () => {
    const moderator = await createUser({ role: 'moderator' });
    const author = await createUser();
    const post = await createPost(author.id);
    await createComment({ postId: post.id, authorId: author.id, status: 'pending' });

    const token = generateToken({
      id: moderator.id,
      email: moderator.email,
      username: moderator.username,
      role: moderator.role,
    });

    const app = buildApp();
    const response = await request(app)
      .get(`/comments/post/${post.id}?status=pending`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].status).toBe('pending');
  });

  it('should flag a comment for review', async () => {
    const reporter = await createUser();
    const author = await createUser();
    const post = await createPost(author.id);
    const comment = await createComment({ postId: post.id, authorId: author.id, status: 'approved' });

    const token = generateToken({
      id: reporter.id,
      email: reporter.email,
      username: reporter.username,
      role: reporter.role,
    });

    const app = buildApp();
    const response = await request(app)
      .post(`/comments/${comment.id}/flag`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'spam' });

    expect(response.status).toBe(200);
    expect(response.body.comment.status).toBe('flagged');
    expect(response.body.comment.flaggedBy).toBe(reporter.id);
    expect(response.body.comment.flaggedAt).toBeTruthy();
  });

  it('should prevent non moderators from accessing the moderation queue', async () => {
    const user = await createUser();
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const app = buildApp();
    const response = await request(app)
      .get('/comments/moderation/queue')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('should allow moderators to approve a flagged comment', async () => {
    const moderator = await createUser({ role: 'moderator' });
    const author = await createUser();
    const post = await createPost(author.id);
    const comment = await createComment({ postId: post.id, authorId: author.id, status: 'flagged', flaggedBy: author.id });

    const token = generateToken({
      id: moderator.id,
      email: moderator.email,
      username: moderator.username,
      role: moderator.role,
    });

    const app = buildApp();
    const response = await request(app)
      .post(`/comments/${comment.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Legitimate content' });

    expect(response.status).toBe(200);
    expect(response.body.comment.status).toBe('approved');
    expect(response.body.comment.moderatedBy).toBe(moderator.id);
    expect(response.body.comment.moderationNotes).toBe('Legitimate content');
  });
});
