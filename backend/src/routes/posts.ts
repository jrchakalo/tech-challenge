import { Router } from 'express';
import { 
  getPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  likePost 
} from '../controllers/postController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, createPostSchema, updatePostSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// Public routes (with optional authentication)
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, validateRequest(idParamSchema, 'params'), getPostById);

// Protected routes
router.post('/', authenticateToken, validateRequest(createPostSchema), createPost);
router.put('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), validateRequest(updatePostSchema), updatePost);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), deletePost);
router.post('/:id/like', authenticateToken, validateRequest(idParamSchema, 'params'), likePost);

export default router;