import api from './api';
import { Comment, CommentsResponse, CreateCommentRequest } from '../types';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

interface CommentQueryParams {
  page?: number;
  limit?: number;
  status?: CommentStatus | CommentStatus[];
}

interface CommentModerationResponse {
  message: string;
  comment: Comment;
}

const buildQueryString = (params: CommentQueryParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    statuses.forEach((status) => searchParams.append('status', status));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const commentService = {
  async getComments(postId: number, params: CommentQueryParams = {}): Promise<CommentsResponse> {
    const query = buildQueryString(params);
    const response = await api.get<CommentsResponse>(`/comments/post/${postId}${query}`);
    return response.data;
  },

  async createComment(commentData: CreateCommentRequest): Promise<{ message: string; comment: Comment }> {
    const response = await api.post<{ message: string; comment: Comment }>('/comments', commentData);
    return response.data;
  },

  async updateComment(id: number, content: string): Promise<{ message: string; comment: Comment }> {
    const response = await api.put<{ message: string; comment: Comment }>(`/comments/${id}`, { content });
    return response.data;
  },

  async deleteComment(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/comments/${id}`);
    return response.data;
  },

  async getModerationQueue(params: CommentQueryParams = {}): Promise<CommentsResponse> {
    const query = buildQueryString(params);
    const response = await api.get<CommentsResponse>(`/comments/moderation/queue${query}`);
    return response.data;
  },

  async approveComment(id: number, reason?: string | null): Promise<CommentModerationResponse> {
    const response = await api.post<CommentModerationResponse>(`/comments/${id}/approve`, {
      reason: reason ?? null,
    });
    return response.data;
  },

  async rejectComment(id: number, reason?: string | null): Promise<CommentModerationResponse> {
    const response = await api.post<CommentModerationResponse>(`/comments/${id}/reject`, {
      reason: reason ?? null,
    });
    return response.data;
  },

  async flagComment(id: number, reason?: string | null): Promise<CommentModerationResponse> {
    const response = await api.post<CommentModerationResponse>(`/comments/${id}/flag`, {
      reason: reason ?? null,
    });
    return response.data;
  },
};