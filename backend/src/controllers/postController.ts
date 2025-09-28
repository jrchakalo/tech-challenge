import { Response } from 'express';
import { Op } from 'sequelize';
import { Post, User, Comment, Like } from '../models';
import { AuthenticatedRequest, CreatePostRequest, UpdatePostRequest, PostQuery } from '../types';
import { sequelize } from '../config/database';
import { getIO } from '../realtime/socket';

export const getPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      tags,
      authorId,
    }: PostQuery = req.query;

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNumber - 1) * limitNumber;

    const whereClause: any = {
      isPublished: true,
    };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause.tags = {
        [Op.overlap]: tagArray,
      };
    }

    if (authorId) {
      whereClause.authorId = parseInt(authorId);
    }

    const totalItems = await Post.count({ where: whereClause });

    const posts = await Post.findAll({
      where: whereClause,
      limit: limitNumber,
      offset,
      order: [[sortBy, sortOrder]],
      subQuery: false,
      attributes: {
        include: [
          [
            sequelize.literal('COUNT(DISTINCT("comments"."id"))'),
            'commentCount',
          ],
          [
            sequelize.literal('COUNT(DISTINCT("likes"."id"))'),
            'likeCount',
          ],
        ],
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: [],
          required: false,
        },
        {
          model: Like,
          as: 'likes',
          attributes: [],
          required: false,
        },
      ],
      group: ['Post.id', 'author.id'],
    });

    const postIds = posts.map((post) => post.id);

    let likedPostIds = new Set<number>();
    if (req.user && postIds.length > 0) {
      const userLikes = await Like.findAll({
        attributes: ['postId'],
        where: {
          userId: req.user.id,
          postId: postIds,
        },
      });

      likedPostIds = new Set(userLikes.map((like) => like.postId));
    }

    const postsWithCounts = posts.map((post) => {
      const postJson = post.toJSON() as any;

      postJson.commentCount = Number(post.get('commentCount') ?? 0);
      postJson.likeCount = Number(post.get('likeCount') ?? 0);
      postJson.isLiked = req.user ? likedPostIds.has(post.id) : false;

      return postJson;
    });

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limitNumber) : 0;

    res.status(200).json({
      posts: postsWithCounts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(parseInt(id), {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
        },
      ],
    });

    if (!post || !post.isPublished) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    const commentsWithAuthors = await Comment.findAll({
      where: { postId: post.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
    
    const likeCount = await Like.count({ where: { postId: post.id } });
    const isLiked = req.user 
      ? await Like.findOne({ where: { postId: post.id, userId: req.user.id } }) !== null
      : false;

    const serializedComments = commentsWithAuthors.map((comment) => comment.toJSON());

    res.status(200).json({
      post: {
        ...post.toJSON(),
        comments: serializedComments,
        likeCount,
        isLiked,
      },
    });
  } catch (error) {
    console.error('Get post by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { title, content, excerpt, imageUrl, tags }: CreatePostRequest = req.body;

    const post = await Post.create({
      title,
      content,
      excerpt,
      imageUrl,
      tags: tags || [],
      authorId: req.user.id,
      isPublished: true,
      publishedAt: new Date(),
    });

    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });

    const io = getIO();
    if (io && createdPost) {
      io.emit('post:created', {
        post: createdPost.toJSON(),
      });
    }

    res.status(201).json({
      message: 'Post created successfully',
      post: createdPost,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { title, content, excerpt, imageUrl, tags }: UpdatePostRequest = req.body;

    const post = await Post.findByPk(parseInt(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user is the author
    if (post.authorId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to update this post' });
      return;
    }

    await post.update({
      title,
      content,
      excerpt,
      imageUrl,
      tags,
    });

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });

    const io = getIO();
    if (io && updatedPost) {
      io.emit('post:updated', {
        post: updatedPost.toJSON(),
      });
    }

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const post = await Post.findByPk(parseInt(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user is the author
    if (post.authorId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to delete this post' });
      return;
    }

    await post.destroy();

    const io = getIO();
    if (io) {
      io.emit('post:deleted', {
        postId: post.id,
      });
    }

    res.status(200).json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const likePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const post = await Post.findByPk(parseInt(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const existingLike = await Like.findOne({
      where: { postId: post.id, userId: req.user.id },
    });

    if (existingLike) {
      await existingLike.destroy();
      res.status(200).json({ message: 'Post unliked', liked: false });
    } else {
      await Like.create({ postId: post.id, userId: req.user.id });
      res.status(200).json({ message: 'Post liked', liked: true });
    }

    const io = getIO();
    if (io) {
      io.emit('post:likeToggled', {
        postId: post.id,
        liked: !existingLike,
        userId: req.user.id,
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};