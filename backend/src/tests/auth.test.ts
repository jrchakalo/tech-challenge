import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Response } from 'express';
import { User } from '../models';
import { generateToken } from '../utils/jwt';
import { changePassword } from '../controllers/authController';
import { AuthenticatedRequest } from '../types';

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('User Registration', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = await User.create(userData);
      
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should validate password correctly', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      
      const isValid = await user.validatePassword('password123');
      const isInvalid = await user.validatePassword('wrongpassword');
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    // Intentionally broken test
    it('should fail - broken test example', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      
      // This test will fail because we're expecting the wrong value
      expect(user.username).toBe('wrongusername');
    });
  });

  describe('JWT Token', () => {
    it('should generate and verify token correctly', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    // Intentionally broken test
    it('should fail - broken JWT test', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      const token = generateToken(payload);
      
      // This will fail because we're expecting undefined
      expect(token).toBeUndefined();
    });
  });

  describe('Change Password', () => {
    it('should update the password when current password is valid', async () => {
      const user = await User.create({
        username: 'changepass',
        email: 'changepass@example.com',
        password: 'SenhaAtual123',
      });

      const req = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        body: {
          currentPassword: 'SenhaAtual123',
          newPassword: 'NovaSenha123',
          confirmPassword: 'NovaSenha123',
        },
      } as AuthenticatedRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });

      const updatedUser = await User.findByPk(user.id);
      const isOldPasswordValid = await updatedUser!.validatePassword('SenhaAtual123');
      const isNewPasswordValid = await updatedUser!.validatePassword('NovaSenha123');

      expect(isOldPasswordValid).toBe(false);
      expect(isNewPasswordValid).toBe(true);
    });
  });
});