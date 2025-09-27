import { 
  DataTypes, 
  Model, 
  Optional, 
  Association, 
  HasManyGetAssociationsMixin,
  HasManyCreateAssociationMixin 
} from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../config/security';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstName?: string;
  public lastName?: string;
  public avatar?: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getPosts!: HasManyGetAssociationsMixin<any>;
  public createPost!: HasManyCreateAssociationMixin<any>;
  public getComments!: HasManyGetAssociationsMixin<any>;
  public createComment!: HasManyCreateAssociationMixin<any>;

  public static associations: {
    posts: Association<User, any>;
    comments: Association<User, any>;
    likes: Association<User, any>;
  };

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public toJSON(): Omit<UserAttributes, 'password'> {
    const values = { ...this.get() } as any;
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        is: /^[a-zA-Z0-9_-]+$/,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          user.password = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
        }
      },
    },
  }
);

export default User;