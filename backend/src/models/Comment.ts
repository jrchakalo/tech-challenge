import { 
  DataTypes, 
  Model, 
  Optional, 
  Association, 
  BelongsToGetAssociationMixin,
  HasManyGetAssociationsMixin 
} from 'sequelize';
import { sequelize } from '../config/database';

interface CommentAttributes {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  parentId?: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatedBy?: number | null;
  moderatedAt?: Date | null;
  moderationNotes?: string | null;
  flaggedBy?: number | null;
  flaggedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'status' | 'moderatedBy' | 'moderatedAt' | 'moderationNotes' | 'flaggedBy' | 'flaggedAt' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: number;
  public content!: string;
  public postId!: number;
  public authorId!: number;
  public parentId?: number;
  public status!: 'pending' | 'approved' | 'rejected' | 'flagged';
  public moderatedBy?: number | null;
  public moderatedAt?: Date | null;
  public moderationNotes?: string | null;
  public flaggedBy?: number | null;
  public flaggedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getPost!: BelongsToGetAssociationMixin<any>;
  public getAuthor!: BelongsToGetAssociationMixin<any>;
  public getParent!: BelongsToGetAssociationMixin<Comment>;
  public getReplies!: HasManyGetAssociationsMixin<Comment>;

  public static associations: {
    post: Association<Comment, any>;
    author: Association<Comment, any>;
    parent: Association<Comment, Comment>;
    replies: Association<Comment, Comment>;
  };
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
      },
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      allowNull: false,
      defaultValue: 'pending',
    },
    moderatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    moderatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    moderationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    flaggedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    flaggedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    indexes: [
      {
        fields: ['postId'],
      },
      {
        fields: ['authorId'],
      },
      {
        fields: ['parentId'],
      },
    ],
  }
);

export default Comment;