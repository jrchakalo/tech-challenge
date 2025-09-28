import { 
  DataTypes, 
  Model, 
  Optional, 
  Association, 
  HasManyGetAssociationsMixin,
  BelongsToGetAssociationMixin,
  HasManyCountAssociationsMixin
} from 'sequelize';
import { sequelize } from '../config/database';

interface PostAttributes {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: Date;
  viewCount: number;
  authorId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'isPublished' | 'viewCount' | 'createdAt' | 'updatedAt'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public excerpt?: string;
  public imageUrl?: string;
  public tags?: string[];
  public isPublished!: boolean;
  public publishedAt?: Date;
  public viewCount!: number;
  public authorId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getAuthor!: BelongsToGetAssociationMixin<any>;
  public getComments!: HasManyGetAssociationsMixin<any>;
  public countComments!: HasManyCountAssociationsMixin;
  public getLikes!: HasManyGetAssociationsMixin<any>;
  public countLikes!: HasManyCountAssociationsMixin;

  public static associations: {
    author: Association<Post, any>;
    comments: Association<Post, any>;
    likes: Association<Post, any>;
  };

}

const tagsColumn = sequelize.getDialect() === 'postgres'
  ? DataTypes.ARRAY(DataTypes.STRING)
  : DataTypes.JSON;

const postIndexes: any[] = [
  {
    fields: ['authorId'],
  },
  {
    fields: ['isPublished'],
  },
  {
    fields: ['publishedAt'],
  },
];

if (sequelize.getDialect() === 'postgres') {
  postIndexes.push({
    fields: ['tags'],
    using: 'gin',
  });
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 50000],
      },
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: tagsColumn,
      allowNull: true,
      defaultValue: [],
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
  },
  {
    sequelize,
    tableName: 'posts',
    indexes: postIndexes,
  }
);

export default Post;