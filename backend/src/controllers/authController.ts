import crypto from "crypto";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { Post, User } from "../models";
import {
  AuthenticatedRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from "../types";
import { generateToken } from "../utils/jwt";
import { PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES } from "../config/security";

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

export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email }: ForgotPasswordRequest = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      res.status(200).json({
        message:
          "Se o email estiver cadastrado, enviaremos instruções para recuperação de senha.",
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000
    );

    user.resetPasswordToken = hashedToken;
    user.resetPasswordTokenExpires = expiresAt;
    await user.save();

    const responsePayload: { message: string; resetToken?: string } = {
      message:
        "Se o email estiver cadastrado, enviaremos instruções para recuperação de senha.",
    };

    if (process.env.NODE_ENV === "test") {
      responsePayload.resetToken = rawToken;
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword }: ResetPasswordRequest = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpires: {
          [Op.gt]: new Date(),
        },
        isActive: true,
      },
    });

    if (!user) {
      res.status(400).json({ error: "Token inválido ou expirado" });
      return;
    }

    const isSamePassword = await user.validatePassword(newPassword);
    if (isSamePassword) {
      res.status(400).json({ error: "Nova senha deve ser diferente da atual" });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;
    await user.save();

    res.status(200).json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
