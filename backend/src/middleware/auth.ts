import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { User } from '../models';
import { verifyToken } from '../utils/jwt';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: user.role,
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    
    const user = await User.findByPk(decoded.id);
    if (user && user.isActive) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        role: user.role,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};

const normalizeRoleArray = (roles: UserRole[]): UserRole[] => [...new Set(roles)];

export const authorizeRoles = (...roles: UserRole[]) => {
  const allowedRoles = normalizeRoleArray(roles);

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};