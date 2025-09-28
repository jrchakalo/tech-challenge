import { sequelize } from '../config/database';
import User from './User';
import Post from './Post';
import Comment from './Comment';
import Like from './Like';

// User associations
User.hasMany(Post, {
  foreignKey: 'authorId',
  as: 'posts',
});

User.hasMany(Comment, {
  foreignKey: 'authorId',
  as: 'comments',
});

User.hasMany(Comment, {
  foreignKey: 'moderatedBy',
  as: 'moderatedComments',
});

User.hasMany(Comment, {
  foreignKey: 'flaggedBy',
  as: 'flaggedComments',
});

User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes',
});

// Post associations
Post.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

Post.hasMany(Comment, {
  foreignKey: 'postId',
  as: 'comments',
});

Post.hasMany(Like, {
  foreignKey: 'postId',
  as: 'likes',
});

// Comment associations
Comment.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

Comment.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent',
});

Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
});

Comment.belongsTo(User, {
  foreignKey: 'moderatedBy',
  as: 'moderator',
});

Comment.belongsTo(User, {
  foreignKey: 'flaggedBy',
  as: 'flaggedByUser',
});

// Like associations
Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Like.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

export {
  sequelize,
  User,
  Post,
  Comment,
  Like,
};

export default {
  sequelize,
  User,
  Post,
  Comment,
  Like,
};