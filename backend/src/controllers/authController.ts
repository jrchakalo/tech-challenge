import { Request, Response } from "express";
import { Op } from "sequelize";
import { Post, User } from "../models";
import {
  AuthenticatedRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  LoginRequest,
} from "../types";
import { generateToken } from "../utils/jwt";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
    }: CreateUserRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(409).json({
        error: "User already exists with this email or username",
      });
      return;
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(200).json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Post,
          as: "posts",
          attributes: ["id", "title", "createdAt"],
        },
      ],
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { firstName, lastName, avatar } = req.body;

    await user.update({
      firstName,
      lastName,
      avatar,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isCurrentValid = await user.validatePassword(currentPassword);
    if (!isCurrentValid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const isSamePassword = await user.validatePassword(newPassword);
    if (isSamePassword) {
      res.status(400).json({ error: "New password must be different" });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
