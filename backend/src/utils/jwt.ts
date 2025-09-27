import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from '../config/security';

const accessTokenSignOptions: SignOptions = {
  expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  algorithm: 'HS512', // Mantemos uma cifra mais forte para evitar brute force.
};

export const verifyToken = (token: string): JWTPayload => {
  const verifyOptions: VerifyOptions = { algorithms: ['HS512'] };
  return jwt.verify(token, JWT_SECRET, verifyOptions) as JWTPayload;
};

const refreshTokenSignOptions: SignOptions = {
  expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  algorithm: 'HS512',
};

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, accessTokenSignOptions);
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, refreshTokenSignOptions);
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  const verifyOptions: VerifyOptions = { algorithms: ['HS512'] };
  return jwt.verify(token, JWT_REFRESH_SECRET, verifyOptions) as JWTPayload;
};