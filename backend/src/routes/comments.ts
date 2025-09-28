import { Router } from 'express';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment 
} from '../controllers/commentController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, createCommentSchema, postIdParamSchema, idParamSchema, updateCommentSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/post/:postId', optionalAuth, validateRequest(postIdParamSchema, 'params'), getComments);

// Protected routes
router.post('/', authenticateToken, validateRequest(createCommentSchema), createComment);
router.put('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), validateRequest(updateCommentSchema), updateComment);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), deleteComment);

export default router;