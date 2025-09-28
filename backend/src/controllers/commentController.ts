import { Response } from 'express';
import { Op, Order } from 'sequelize';
import { Comment, Post, User } from '../models';
import {
  AuthenticatedRequest,
  CreateCommentRequest,
  FlagCommentRequest,
  ModerationActionRequest,
} from '../types';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

const COMMENT_STATUSES: CommentStatus[] = ['pending', 'approved', 'rejected', 'flagged'];

const isModerator = (req: AuthenticatedRequest): boolean =>
  !!req.user && (req.user.role === 'moderator' || req.user.role === 'admin');

const normalizeStatuses = (
  status?: CommentStatus | CommentStatus[]
): CommentStatus[] => {
  if (!status) {
    return [];
  }

  return Array.isArray(status) ? status : [status];
};

const buildStatusCondition = (statuses: CommentStatus[]) => {
  if (statuses.length === 1) {
    return statuses[0];
  }

  return {
    [Op.in]: Array.from(new Set(statuses)),
  };
};

const baseAuthorInclude = {
  model: User,
  as: 'author',
  attributes: ['id', 'username', 'avatar'],
};

const moderatorInclude = {
  model: User,
  as: 'moderator',
  attributes: ['id', 'username'],
};

const flaggedByInclude = {
  model: User,
  as: 'flaggedByUser',
  attributes: ['id', 'username'],
};

const buildRepliesInclude = (
  statusCondition: unknown,
  includeModerationDetails: boolean
) => {
  const include = [{ ...baseAuthorInclude }];

  if (includeModerationDetails) {
    include.push({ ...moderatorInclude }, { ...flaggedByInclude });
  }

  const repliesOrder: Order = [['createdAt', 'ASC']];

  return {
    model: Comment,
    as: 'replies',
    where: { status: statusCondition },
    required: false,
    include,
    order: repliesOrder,
  } as any;
};

const getPaginationMeta = (totalItems: number, page: number, limit: number) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    currentPage: page,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { page, limit, status } = req.query as unknown as {
      page?: number;
      limit?: number;
      status?: CommentStatus | CommentStatus[];
    };

    const pageNumber = Math.max(1, page ?? 1);
    const limitNumber = Math.max(1, Math.min(100, limit ?? 20));

    const post = await Post.findByPk(Number(postId));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const moderatorView = isModerator(req);
    const requestedStatuses = normalizeStatuses(status);
    const sanitizedStatuses = requestedStatuses.filter((candidate): candidate is CommentStatus =>
      COMMENT_STATUSES.includes(candidate)
    );

    if (requestedStatuses.length !== sanitizedStatuses.length) {
      res.status(400).json({ error: 'Invalid status filter provided' });
      return;
    }

    if (!moderatorView && sanitizedStatuses.some(item => item !== 'approved')) {
      res.status(403).json({ error: 'Insufficient permissions to view those comments' });
      return;
    }

    const fallbackStatuses: CommentStatus[] = moderatorView
      ? ['approved', 'pending', 'flagged']
      : ['approved'];
    const statusesToUse = sanitizedStatuses.length ? sanitizedStatuses : fallbackStatuses;
    const statusCondition = buildStatusCondition(statusesToUse);

    const comments = await Comment.findAndCountAll({
      where: {
        postId: Number(postId),
        parentId: null,
        status: statusCondition,
      } as any,
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
      order: [['createdAt', 'DESC']],
      include: [
        { ...baseAuthorInclude },
        buildRepliesInclude(statusCondition, moderatorView),
        ...(moderatorView ? [{ ...moderatorInclude }, { ...flaggedByInclude }] : []),
      ] as any,
    });

    res.status(200).json({
      comments: comments.rows,
      pagination: getPaginationMeta(comments.count, pageNumber, limitNumber),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { content, postId, parentId }: CreateCommentRequest = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment || parentComment.postId !== postId) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    const comment = await Comment.create({
      content,
      postId,
      parentId,
      authorId: req.user.id,
      status: 'pending',
    });

    await comment.reload({
      include: [{ ...baseAuthorInclude }],
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to update this comment' });
      return;
    }

    await comment.update({
      content,
      status: 'pending',
      moderatedBy: null,
      moderatedAt: null,
      moderationNotes: null,
      flaggedBy: null,
      flaggedAt: null,
    });

    await comment.reload({
      include: [{ ...baseAuthorInclude }],
    });

    res.status(200).json({
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const moderatorView = isModerator(req);
    const isAuthor = comment.authorId === req.user.id;

    if (!isAuthor && !moderatorView) {
      res.status(403).json({ error: 'Not authorized to delete this comment' });
      return;
    }

    await comment.destroy();

    res.status(200).json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason }: ModerationActionRequest = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const moderationNotes = reason ?? comment.moderationNotes ?? null;

    await comment.update({
      status: 'approved',
      moderatedBy: req.user.id,
      moderatedAt: new Date(),
      moderationNotes,
      flaggedBy: null,
      flaggedAt: null,
    });

    await comment.reload({
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    res.status(200).json({
      message: 'Comment approved successfully',
      comment,
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason }: ModerationActionRequest = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const moderationNotes = reason ?? comment.moderationNotes ?? null;

    await comment.update({
      status: 'rejected',
      moderatedBy: req.user.id,
      moderatedAt: new Date(),
      moderationNotes,
      flaggedBy: null,
      flaggedAt: null,
    });

    await comment.reload({
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    res.status(200).json({
      message: 'Comment rejected successfully',
      comment,
    });
  } catch (error) {
    console.error('Reject comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const flagComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason }: FlagCommentRequest = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId === req.user.id) {
      res.status(400).json({ error: 'You cannot flag your own comment' });
      return;
    }

    if (comment.flaggedBy === req.user.id && comment.status === 'flagged') {
      res.status(409).json({ error: 'Comment already flagged by this user' });
      return;
    }

    const nextStatus: CommentStatus = comment.status === 'rejected' ? 'rejected' : 'flagged';
    const moderationNotes = reason
      ? [comment.moderationNotes, `Flag reason: ${reason}`].filter(Boolean).join('\n')
      : comment.moderationNotes;

    await comment.update({
      status: nextStatus,
      flaggedBy: req.user.id,
      flaggedAt: new Date(),
      moderationNotes: moderationNotes ?? null,
    });

    await comment.reload({
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { ...flaggedByInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    res.status(200).json({
      message: 'Comment flagged for review',
      comment,
    });
  } catch (error) {
    console.error('Flag comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getModerationQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, status } = req.query as unknown as {
      page?: number;
      limit?: number;
      status?: CommentStatus | CommentStatus[];
    };

    const pageNumber = Math.max(1, page ?? 1);
    const limitNumber = Math.max(1, Math.min(100, limit ?? 20));

    const requestedStatuses = normalizeStatuses(status);
    const sanitizedStatuses = requestedStatuses.filter((candidate): candidate is CommentStatus =>
      COMMENT_STATUSES.includes(candidate)
    );

    if (requestedStatuses.length !== sanitizedStatuses.length) {
      res.status(400).json({ error: 'Invalid status filter provided' });
      return;
    }

    const fallbackStatuses: CommentStatus[] = ['pending', 'flagged'];
    const statusesToUse = sanitizedStatuses.length ? sanitizedStatuses : fallbackStatuses;
    const statusCondition = buildStatusCondition(statusesToUse);

    const comments = await Comment.findAndCountAll({
      where: {
        status: statusCondition,
      },
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
      order: [['createdAt', 'DESC']],
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { ...flaggedByInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    res.status(200).json({
      comments: comments.rows,
      pagination: getPaginationMeta(comments.count, pageNumber, limitNumber),
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};