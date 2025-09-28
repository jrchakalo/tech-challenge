import { Router } from 'express';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment,
  approveComment,
  rejectComment,
  flagComment,
  getModerationQueue,
} from '../controllers/commentController';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth';
import { 
  validateRequest, 
  createCommentSchema, 
  postIdParamSchema, 
  idParamSchema, 
  updateCommentSchema,
  moderationActionSchema,
  flagCommentSchema,
  moderationQueueQuerySchema,
  commentListQuerySchema,
} from '../middleware/validation';

const router = Router();

// Public routes
router.get(
  '/post/:postId',
  optionalAuth,
  validateRequest(postIdParamSchema, 'params'),
  validateRequest(commentListQuerySchema, 'query'),
  getComments
);

// Protected routes
router.post('/', authenticateToken, validateRequest(createCommentSchema), createComment);
router.put('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), validateRequest(updateCommentSchema), updateComment);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), deleteComment);
router.post(
  '/:id/flag',
  authenticateToken,
  validateRequest(idParamSchema, 'params'),
  validateRequest(flagCommentSchema),
  flagComment
);

// Moderation routes
router.get(
  '/moderation/queue',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  validateRequest(moderationQueueQuerySchema, 'query'),
  getModerationQueue
);

router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(moderationActionSchema),
  approveComment
);

router.post(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(moderationActionSchema),
  rejectComment
);

export default router;