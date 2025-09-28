import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

type RequestProperty = 'body' | 'params' | 'query';

export const validateRequest = (schema: Joi.Schema, property: RequestProperty = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      res.status(400).json({ 
        error: 'Validation error',
        message: errorMessage,
        details: error.details 
      });
      return;
    }

    (req as any)[property] = value;

    next();
  };
};

// User validation schemas
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_-]+$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(255).required(),
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(255).required(),
  newPassword: Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .disallow(Joi.ref('currentPassword'))
    .required()
    .messages({
      'string.pattern.base': 'Nova senha deve conter pelo menos uma letra e um número',
      'any.disallow': 'Nova senha deve ser diferente da senha atual',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Confirmação de senha não confere com a nova senha',
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().length(64).hex().required().messages({
    'string.length': 'Token de recuperação inválido',
    'string.hex': 'Token de recuperação inválido',
  }),
  newPassword: Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base': 'Nova senha deve conter pelo menos uma letra e um número',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Confirmação de senha não confere com a nova senha',
    }),
});

// Post validation schemas
export const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().min(1).max(50000).required(),
  excerpt: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  content: Joi.string().min(1).max(50000).optional(),
  excerpt: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
}).min(1).messages({
  'object.min': 'Informe ao menos um campo para atualização do post',
});

// Comment validation schemas
export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  postId: Joi.number().integer().positive().required(),
  parentId: Joi.number().integer().positive().optional(),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

const moderationReasonField = Joi.string().trim().max(1000).empty('').allow(null);

export const moderationActionSchema = Joi.object({
  reason: moderationReasonField,
});

export const flagCommentSchema = Joi.object({
  reason: moderationReasonField,
});

const moderationStatus = Joi.string().valid('pending', 'approved', 'rejected', 'flagged');

export const commentListQuerySchema = Joi.object({
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().max(50).default(20),
  status: Joi.alternatives().try(moderationStatus, Joi.array().items(moderationStatus)).optional(),
});

export const moderationQueueQuerySchema = Joi.object({
  status: Joi.alternatives().try(moderationStatus, Joi.array().items(moderationStatus)).optional(),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().max(100).default(20),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  avatar: Joi.string().uri().optional(),
}).min(1).messages({
  'object.min': 'Escolha pelo menos um campo para atualizar seu perfil',
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const postIdParamSchema = Joi.object({
  postId: Joi.number().integer().positive().required(),
});