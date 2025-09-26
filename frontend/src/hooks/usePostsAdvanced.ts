import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postService } from '../services/postService';
import { useAuth } from './useAuth';
import { Post, CreatePostRequest, UpdatePostRequest, PostsResponse } from '../types';

// Custom hook for managing posts
export const usePostsAdvanced = (options?: {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  authorId?: number;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const {
    page = 1,
    limit = 10,
    search,
    tags,
    authorId,
    enabled = true
  } = options || {};

  // Query key for caching
  const queryKey = ['posts', { page, limit, search, tags, authorId }];

  // Fetch posts query
  const {
    data: postsData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery(
    queryKey,
    () => postService.getPosts({ page, limit, search, tags, authorId }),
    {
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      keepPreviousData: true,
      onError: (error) => {
        console.error('Error fetching posts:', error);
      }
    }
  );

  // Create post mutation
  const createPostMutation = useMutation(
    (postData: CreatePostRequest) => postService.createPost(postData),
    {
      onSuccess: ({ post: createdPost }) => {
        // Invalidate and refetch posts
        queryClient.invalidateQueries(['posts']);
        if (createdPost) {
          queryClient.setQueryData(['post', createdPost.id], { post: createdPost });
        }
      },
      onError: (error) => {
        console.error('Error creating post:', error);
      }
    }
  );

  // Update post mutation
  const updatePostMutation = useMutation(
    ({ id, data }: { id: number; data: UpdatePostRequest }) =>
      postService.updatePost(id, data),
    {
      onSuccess: ({ post: updatedPost }) => {
        // Update cache
        if (updatedPost) {
          queryClient.setQueryData(['post', updatedPost.id], { post: updatedPost });
        }
        queryClient.invalidateQueries(['posts']);
      },
      onError: (error) => {
        console.error('Error updating post:', error);
      }
    }
  );

  // Delete post mutation
  const deletePostMutation = useMutation(
    (postId: number) => postService.deletePost(postId),
    {
      onSuccess: (_, deletedPostId) => {
        // Remove from cache
        queryClient.removeQueries(['post', deletedPostId]);
        queryClient.invalidateQueries(['posts']);
      },
      onError: (error) => {
        console.error('Error deleting post:', error);
      }
    }
  );

  // Like/Unlike post mutation
  const likePostMutation = useMutation(
    (postId: number) => postService.likePost(postId),
    {
      onMutate: async (postId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(['post', postId]);
        await queryClient.cancelQueries(['posts']);

        // Snapshot previous value
        const previousPost = queryClient.getQueryData<{ post: Post }>(['post', postId]);
        const previousPosts = queryClient.getQueryData<PostsResponse>(queryKey);

        if (previousPost?.post) {
          const wasLiked = !!previousPost.post.isLiked;
          const currentLikeCount = previousPost.post.likeCount ?? 0;
          const optimisticPost: { post: Post } = {
            post: {
              ...previousPost.post,
              isLiked: !wasLiked,
              likeCount: wasLiked
                ? Math.max(0, currentLikeCount - 1)
                : currentLikeCount + 1,
            },
          };

          queryClient.setQueryData(['post', postId], optimisticPost);
        }

        if (previousPosts?.posts) {
          const optimisticPosts: PostsResponse = {
            ...previousPosts,
            posts: previousPosts.posts.map((postItem) => {
              if (postItem.id !== postId) {
                return postItem;
              }

              const wasLiked = !!postItem.isLiked;
              const currentLikeCount = postItem.likeCount ?? 0;

              return {
                ...postItem,
                isLiked: !wasLiked,
                likeCount: wasLiked
                  ? Math.max(0, currentLikeCount - 1)
                  : currentLikeCount + 1,
              };
            }),
          };

          queryClient.setQueryData(queryKey, optimisticPosts);
        }

        return { previousPost, previousPosts };
      },
      onError: (err, postId, context) => {
        // Rollback on error
        if (context?.previousPost) {
          queryClient.setQueryData(['post', postId], context.previousPost);
        }
        if (context?.previousPosts) {
          queryClient.setQueryData(queryKey, context.previousPosts);
        }
      },
      onSettled: (data, error, postId) => {
        // Always refetch after error or success
        queryClient.invalidateQueries(['post', postId]);
        queryClient.invalidateQueries(['posts']);
      },
    }
  );

  // Helper functions
  const createPost = useCallback((postData: CreatePostRequest) => {
    return createPostMutation.mutateAsync(postData);
  }, [createPostMutation]);

  const updatePost = useCallback((id: number, data: UpdatePostRequest) => {
    return updatePostMutation.mutateAsync({ id, data });
  }, [updatePostMutation]);

  const deletePost = useCallback((postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      return deletePostMutation.mutateAsync(postId);
    }
  }, [deletePostMutation]);

  const likePost = useCallback((postId: number) => {
    if (!user) {
      throw new Error('Must be logged in to like posts');
    }
    return likePostMutation.mutateAsync(postId);
  }, [likePostMutation, user]);

  const canEditPost = useCallback((postItem: Post) => {
    return !!user && user.id === postItem.authorId;
  }, [user]);

  const canDeletePost = useCallback((postItem: Post) => {
    return !!user && user.id === postItem.authorId;
  }, [user]);

  return {
    // Data
    posts: postsData?.posts || [],
    pagination: postsData?.pagination,
    
    // Loading states
    isLoading,
    isFetching,
    isCreating: createPostMutation.isLoading,
    isUpdating: updatePostMutation.isLoading,
    isDeleting: deletePostMutation.isLoading,
    isLiking: likePostMutation.isLoading,
    
    // Error states
    error,
    createError: createPostMutation.error,
    updateError: updatePostMutation.error,
    deleteError: deletePostMutation.error,
    likeError: likePostMutation.error,
    
    // Actions
    createPost,
    updatePost,
    deletePost,
    likePost,
    refetch,
    
    // Utility functions
    canEditPost,
    canDeletePost,
    
    // Reset functions
    resetCreateError: createPostMutation.reset,
    resetUpdateError: updatePostMutation.reset,
    resetDeleteError: deletePostMutation.reset,
    resetLikeError: likePostMutation.reset,
  };
};

// Hook for a single post
export const usePost = (postId: number, enabled = true) => {
  const queryClient = useQueryClient();

  const {
    data: postData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['post', postId],
    () => postService.getPostById(postId),
    {
      enabled: enabled && !!postId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Prefetch related posts
  useEffect(() => {
    const tags = postData?.post?.tags ?? [];
    if (tags.length > 0) {
      queryClient.prefetchQuery(
        ['posts', { tags: tags.slice(0, 3) }],
        () => postService.getPosts({ tags: tags.slice(0, 3), limit: 5 }),
        {
          staleTime: 10 * 60 * 1000, // 10 minutes
        }
      );
    }
  }, [postData?.post?.tags, queryClient]);

  return {
    post: postData?.post,
    isLoading,
    error,
    refetch,
  };
};

// Hook for post drafts
export const useDrafts = () => {
  const { user } = useAuth();
  
  return useQuery(
    ['posts', 'drafts', user?.id],
    () => postService.getPosts({ 
      authorId: user?.id, 
      published: false,
      limit: 50 
    }),
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

// Hook for managing post view tracking
export const usePostView = (postId: number) => {
  const [hasViewed, setHasViewed] = useState(false);

  const trackView = useCallback(() => {
    if (!hasViewed && postId) {
      // Track view (could be API call or analytics)
      setHasViewed(true);
      // postService.trackView(postId);
    }
  }, [postId, hasViewed]);

  return {
    trackView,
    hasViewed,
  };
};

// Hook for post search with debouncing
export const usePostSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { posts, isLoading, error } = usePostsAdvanced({
    search: debouncedSearchTerm,
    tags: selectedTags,
    enabled: debouncedSearchTerm.length > 0 || selectedTags.length > 0,
  });

  const addTag = useCallback((tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev : [...prev, tag]));
  }, []);

  const removeTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedTags([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    selectedTags,
    addTag,
    removeTag,
    clearSearch,
    posts: debouncedSearchTerm.length > 0 || selectedTags.length > 0 ? posts : [],
    isLoading,
    error,
    hasQuery: debouncedSearchTerm.length > 0 || selectedTags.length > 0,
  };
};