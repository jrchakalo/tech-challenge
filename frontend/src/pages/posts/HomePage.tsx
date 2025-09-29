import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

import { Post } from '../../types';
import { postService } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import {
  connectRealtime,
  disconnectRealtime,
  subscribeToEvent,
} from '../../services/realtime';
import { Spinner } from '../../components/forms';

const PageWrapper = styled.section`
  padding: 0 ${({ theme }) => theme.space[4]};
`;

const FeedContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const FeedHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const FeedTitle = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const FeedSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const PostsGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[5]};
`;

const Card = styled.article`
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const CardTitle = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CardExcerpt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

const Tags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const CardFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`;

const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const LikeButton = styled.button<{ $liked?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 8px 16px;
  background: ${({ theme, $liked }) =>
    $liked ? `${theme.colors.primary[100]}` : theme.colors.gray[100]};
  color: ${({ theme, $liked }) =>
    $liked ? theme.colors.primary[700] : theme.colors.gray[700]};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: background 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme, $liked, disabled }) => {
      if (disabled) {
        return $liked ? theme.colors.primary[100] : theme.colors.gray[100];
      }
      return $liked ? theme.colors.primary[500] : theme.colors.gray[200];
    }};
    color: ${({ theme, $liked, disabled }) => {
      if (disabled) {
        return $liked ? theme.colors.primary[700] : theme.colors.gray[700];
      }
      return $liked ? '#ffffff' : theme.colors.gray[700];
    }};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[10]} 0;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[8]} 0;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[8]} 0;
  color: ${({ theme }) => theme.colors.red[500]};
`;

const sanitizeCounter = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const mergePostPayload = (incoming: any, previous?: Post): Post => {
  const likeCount = sanitizeCounter(incoming?.likeCount, previous?.likeCount ?? 0);
  const commentCount = sanitizeCounter(incoming?.commentCount, previous?.commentCount ?? 0);
  const isLiked =
    typeof incoming?.isLiked === 'boolean'
      ? incoming.isLiked
      : previous?.isLiked ?? false;

  return {
    ...previous,
    ...incoming,
    likeCount,
    commentCount,
    isLiked,
  } as Post;
};

const useRelativeDate = (value?: string) => {
  return useMemo(() => {
    if (!value) {
      return null;
    }

    try {
      return formatDistanceToNow(new Date(value), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return null;
    }
  }, [value]);
};

interface PostCardProps {
  post: Post;
  onLike: (post: Post) => void;
  isProcessing: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, isProcessing }) => {
  const relativeDate = useRelativeDate(post.createdAt);
  const likeCount = sanitizeCounter(post.likeCount);
  const commentCount = sanitizeCounter(post.commentCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle to={`/post/${post.id}`}>{post.title}</CardTitle>
        <CardMeta>
          <span>{post.author?.username ?? 'Autor desconhecido'}</span>
          {relativeDate && <span>• {relativeDate}</span>}
          <span>• {sanitizeCounter(post.viewCount)} visualizações</span>
        </CardMeta>
      </CardHeader>

      <CardExcerpt>
        {post.excerpt || `${post.content?.slice(0, 180)}${post.content && post.content.length > 180 ? '...' : ''}`}
      </CardExcerpt>

      {post.tags && post.tags.length > 0 && (
        <Tags>
          {post.tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </Tags>
      )}

      <CardFooter>
        <Stats>
          <span>{likeCount} curtidas</span>
          <span>{commentCount} comentários</span>
        </Stats>

        <LikeButton
          type="button"
          onClick={() => onLike(post)}
          disabled={isProcessing}
          $liked={post.isLiked}
        >
          {isProcessing ? <Spinner aria-hidden="true" /> : post.isLiked ? 'Amei' : 'Curtir'}
        </LikeButton>
      </CardFooter>
    </Card>
  );
};

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<number | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await postService.getPosts({ limit: 20 });
      setPosts(response.posts);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não conseguimos carregar os posts agora.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectRealtime();
      return;
    }

    const socket = connectRealtime();
    if (!socket) {
      return;
    }

    // Comentário: ao conectar, garantimos que os eventos mantenham o feed atualizado sem recarregar a página.
    const unsubscribePostCreated = subscribeToEvent<{ post: Post }>('post:created', ({ post }) => {
      setPosts((current) => {
        const next = current.filter((item) => item.id !== post.id);
        return [mergePostPayload(post), ...next];
      });
    });

    const unsubscribePostUpdated = subscribeToEvent<{ post: Post }>('post:updated', ({ post }) => {
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? mergePostPayload(post, item) : item
        )
      );
    });

    const unsubscribePostDeleted = subscribeToEvent<{ postId: number }>('post:deleted', ({ postId }) => {
      setPosts((current) => current.filter((item) => item.id !== postId));
    });

    const unsubscribePostLiked = subscribeToEvent<{ postId: number; liked: boolean; userId: number }>(
      'post:likeToggled',
      ({ postId, liked, userId }) => {
        setPosts((current) =>
          current.map((item) => {
            if (item.id !== postId) {
              return item;
            }

            const baseline = sanitizeCounter(item.likeCount);
            const likeCount = liked ? baseline + 1 : Math.max(0, baseline - 1);
            const isLiked = user?.id === userId ? liked : item.isLiked;

            return {
              ...item,
              likeCount,
              isLiked,
            };
          })
        );
      }
    );

    const unsubscribeCommentCreated = subscribeToEvent<{ comment: { postId: number } }>(
      'comment:created',
      ({ comment }) => {
        if (!comment?.postId) {
          return;
        }
        setPosts((current) =>
          current.map((item) =>
            item.id === comment.postId
              ? { ...item, commentCount: sanitizeCounter(item.commentCount) + 1 }
              : item
          )
        );
      }
    );

    const unsubscribeCommentDeleted = subscribeToEvent<{ commentId: number; postId: number }>(
      'comment:deleted',
      ({ postId }) => {
        setPosts((current) =>
          current.map((item) =>
            item.id === postId
              ? { ...item, commentCount: Math.max(0, sanitizeCounter(item.commentCount) - 1) }
              : item
          )
        );
      }
    );

    return () => {
      unsubscribePostCreated();
      unsubscribePostUpdated();
      unsubscribePostDeleted();
      unsubscribePostLiked();
      unsubscribeCommentCreated();
      unsubscribeCommentDeleted();
    };
  }, [isAuthenticated, user?.id]);

  const handleLike = useCallback(
    async (post: Post) => {
      if (!isAuthenticated) {
        toast.info('Faça login para curtir os posts.');
        return;
      }

      setLikingPostId(post.id);
      try {
        const response = await postService.likePost(post.id);
        setPosts((current) =>
          current.map((item) => {
            if (item.id !== post.id) {
              return item;
            }

            const currentCount = sanitizeCounter(item.likeCount);
            const likeCount = response.liked
              ? currentCount + 1
              : Math.max(0, currentCount - 1);

            return {
              ...item,
              likeCount,
              isLiked: response.liked,
            };
          })
        );
      } catch (err: any) {
        const message = err?.response?.data?.error ?? 'Não foi possível curtir agora.';
        toast.error(message);
      } finally {
        setLikingPostId(null);
      }
    },
    [isAuthenticated]
  );

  return (
    <PageWrapper>
      <FeedContainer>
        <FeedHeader>
          <FeedTitle>Últimos posts</FeedTitle>
          <FeedSubtitle>Novidades aparecem aqui assim que a comunidade publica ou interage.</FeedSubtitle>
        </FeedHeader>

        {loading && (
          <LoadingState>
            <Spinner aria-hidden="true" /> Carregando histórias fresquinhas...
          </LoadingState>
        )}

        {error && !loading && <ErrorState>{error}</ErrorState>}

        {!loading && !error && posts.length === 0 && (
          <EmptyState>
            Ainda não temos posts por aqui. Volte mais tarde ou seja o primeiro a compartilhar algo!
          </EmptyState>
        )}

        {!loading && !error && posts.length > 0 && (
          <PostsGrid>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                isProcessing={likingPostId === post.id}
              />
            ))}
          </PostsGrid>
        )}
      </FeedContainer>
    </PageWrapper>
  );
};
