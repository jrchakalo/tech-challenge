import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Comment, PaginationMeta } from '../../types';
import { commentService } from '../../services/commentService';
import { Spinner, TextArea } from '../../components/forms';
import {
  connectRealtime,
  subscribeToEvent,
} from '../../services/realtime';
import { useAuth } from '../../hooks/useAuth';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

const PageWrapper = styled.section`
  padding: 0 ${({ theme }) => theme.space[4]};
`;

const Content = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const FiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary[500] : theme.colors.gray[200]};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[50] : '#ffffff'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[700] : theme.colors.gray[600]};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 6px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out,
    color 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const CardsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const Card = styled.article`
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[5]};
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

const CardTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatusBadge = styled.span<{ $status: CommentStatus }>`
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.04em;

  ${({ theme, $status }) => {
    switch ($status) {
      case 'approved':
        return `background: ${theme.colors.green[50]}; color: ${theme.colors.green[700]};`;
      case 'rejected':
        return `background: ${theme.colors.red[50]}; color: ${theme.colors.red[700]};`;
      case 'flagged':
        return `background: ${theme.colors.yellow[50]}; color: ${theme.colors.yellow[700]};`;
      default:
        return `background: ${theme.colors.primary[50]}; color: ${theme.colors.primary[700]};`;
    }
  }}
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const CommentContent = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.6;
`;

const NotesField = styled(TextArea)`
  min-height: 80px;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const ActionButton = styled.button<{ $variant?: 'approve' | 'reject' }>`
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 18px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  color: #ffffff;
  transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;

  ${({ theme, $variant }) =>
    $variant === 'reject'
      ? `background: ${theme.colors.red[600]};
         &:hover { background: ${theme.colors.red[700]}; }`
      : `background: ${theme.colors.green[600]};
         &:hover { background: ${theme.colors.green[700]}; }`};

  &:disabled {
    opacity: 0.6;
  }
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.space[10]} 0;
  text-align: center;
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
  padding: ${({ theme }) => theme.space[6]} 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.red[600]};
`;

const PaginationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const PaginationButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #ffffff;
  padding: 8px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

type ModerationStatusFilter = Extract<CommentStatus, 'pending' | 'flagged' | 'approved' | 'rejected'>;

const STATUS_LABELS: Record<ModerationStatusFilter, string> = {
  pending: 'Pendentes',
  flagged: 'Sinalizados',
  approved: 'Aprovados',
  rejected: 'Rejeitados',
};

const DEFAULT_FILTERS: ModerationStatusFilter[] = ['pending', 'flagged'];

interface QueueEventPayload {
  comment: Comment;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return null;
  }
};

export const CommentModerationPage: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [notesByComment, setNotesByComment] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState<ModerationStatusFilter[]>(DEFAULT_FILTERS);

  const fetchQueue = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await commentService.getModerationQueue({
          status: filters,
        });
        setComments(response.comments);
        setPagination(response.pagination);
      } catch (err: any) {
        const message = err?.response?.data?.error ?? 'Não foi possível carregar a fila agora.';
        setError(message);
      } finally {
        if (!options.silent) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = connectRealtime();
    if (!socket) {
      return;
    }

    const handleQueueMutation = () => {
      // Comentário: Quando a fila muda em outro lugar, fazemos uma atualização incremental para evitar decisões defasadas.
      fetchQueue({ silent: true });
    };

    const unsubscribeCreated = subscribeToEvent<QueueEventPayload>('comment:created', handleQueueMutation);
    const unsubscribeModerated = subscribeToEvent<QueueEventPayload & { action: string }>(
      'comment:moderated',
      handleQueueMutation
    );

    return () => {
      unsubscribeCreated();
      unsubscribeModerated();
    };
  }, [fetchQueue, user]);

  const toggleFilter = (status: ModerationStatusFilter) => {
    setFilters((current) => {
      const isActive = current.includes(status);
      if (isActive) {
        const next = current.filter((item) => item !== status);
        return next.length ? next : DEFAULT_FILTERS;
      }
      return [...current, status];
    });
  };

  const handleNotesChange = (commentId: number, value: string) => {
    setNotesByComment((current) => ({
      ...current,
      [commentId]: value,
    }));
  };

  const shouldDisplayComment = useCallback(
    (comment: Comment) => filters.includes(comment.status as ModerationStatusFilter),
    [filters]
  );

  const upsertComment = useCallback(
    (comment: Comment) => {
      setComments((current) => {
        const exists = current.some((item) => item.id === comment.id);
        const shouldShow = shouldDisplayComment(comment);

        if (!exists && shouldShow) {
          return [comment, ...current];
        }

        if (!shouldShow) {
          return current.filter((item) => item.id !== comment.id);
        }

        return current.map((item) => (item.id === comment.id ? comment : item));
      });
    },
    [shouldDisplayComment]
  );

  const moderateComment = useCallback(
    async (commentId: number, action: 'approve' | 'reject') => {
      setProcessingId(commentId);
      try {
        const reason = notesByComment[commentId]?.trim() || undefined;
        const response =
          action === 'approve'
            ? await commentService.approveComment(commentId, reason)
            : await commentService.rejectComment(commentId, reason);

        upsertComment(response.comment);
        setNotesByComment((current) => {
          const { [commentId]: _, ...rest } = current;
          return rest;
        });
        toast.success(
          action === 'approve'
            ? 'Comentário aprovado com sucesso.'
            : 'Comentário rejeitado com sucesso.'
        );
      } catch (err: any) {
        const message = err?.response?.data?.error ?? 'Não foi possível concluir a ação agora.';
        toast.error(message);
      } finally {
        setProcessingId(null);
      }
    },
    [notesByComment, upsertComment]
  );

  const handleNextPage = async () => {
    if (!pagination?.hasNextPage) {
      return;
    }

    try {
      const response = await commentService.getModerationQueue({
        status: filters,
        page: (pagination.currentPage ?? 1) + 1,
      });
      setComments((current) => [...current, ...response.comments]);
      setPagination(response.pagination);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível carregar mais comentários.';
      toast.error(message);
    }
  };

  const handlePrevPage = async () => {
    if (!pagination?.hasPrevPage) {
      return;
    }

    try {
      const response = await commentService.getModerationQueue({
        status: filters,
        page: Math.max(1, pagination.currentPage - 1),
      });
      setComments(response.comments);
      setPagination(response.pagination);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não conseguimos voltar a página anterior.';
      toast.error(message);
    }
  };

  const queueEmpty = !loading && !error && comments.length === 0;

  const paginationLabel = useMemo(() => {
    if (!pagination) {
      return null;
    }

    return `Página ${pagination.currentPage} de ${pagination.totalPages}`;
  }, [pagination]);

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Moderação de Comentários</Title>
          <Subtitle>
            Gerencie comentários pendentes e sinalizados com feedback imediato para a comunidade.
          </Subtitle>
          <FiltersBar>
            {(['pending', 'flagged', 'approved', 'rejected'] as ModerationStatusFilter[]).map((status) => (
              <FilterButton
                key={status}
                type="button"
                $active={filters.includes(status)}
                onClick={() => toggleFilter(status)}
              >
                {STATUS_LABELS[status]}
              </FilterButton>
            ))}
          </FiltersBar>
        </Header>

        {loading && (
          <LoadingState>
            <Spinner aria-hidden="true" /> Carregando comentários...
          </LoadingState>
        )}

        {error && !loading && <ErrorState>{error}</ErrorState>}

        {queueEmpty && <EmptyState>Nenhum comentário para moderar agora. Aproveite um café ☕</EmptyState>}

        {!loading && !error && comments.length > 0 && (
          <CardsGrid>
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader>
                  <CardTitle>
                    {comment.post ? (
                      <Link to={`/post/${comment.post.id}`}>{comment.post.title}</Link>
                    ) : (
                      'Comentário sem referência de post'
                    )}
                  </CardTitle>
                  <CardMeta>
                    <span>Autor: {comment.author?.username ?? 'Desconhecido'}</span>
                    <span>•</span>
                    <span>Enviado em {formatDate(comment.createdAt) ?? 'N/D'}</span>
                    <span>•</span>
                    <StatusBadge $status={comment.status}>{comment.status}</StatusBadge>
                    {comment.flaggedByUser && (
                      <>
                        <span>•</span>
                        <span>Sinalizado por {comment.flaggedByUser.username}</span>
                      </>
                    )}
                    {comment.moderator && comment.moderatedAt && (
                      <>
                        <span>•</span>
                        <span>
                          Última ação de {comment.moderator.username} em{' '}
                          {formatDate(comment.moderatedAt) ?? 'N/D'}
                        </span>
                      </>
                    )}
                  </CardMeta>
                </CardHeader>

                <CardBody>
                  <CommentContent>{comment.content}</CommentContent>
                  <NotesField
                    placeholder="Motivo (opcional) — compartilhe contexto para o autor"
                    value={notesByComment[comment.id] ?? ''}
                    onChange={(event) => handleNotesChange(comment.id, event.target.value)}
                  />
                  <ActionsRow>
                    <ActionButton
                      type="button"
                      onClick={() => moderateComment(comment.id, 'approve')}
                      disabled={processingId === comment.id}
                    >
                      {processingId === comment.id ? <Spinner aria-hidden="true" /> : 'Aprovar'}
                    </ActionButton>
                    <ActionButton
                      type="button"
                      $variant="reject"
                      onClick={() => moderateComment(comment.id, 'reject')}
                      disabled={processingId === comment.id}
                    >
                      {processingId === comment.id ? <Spinner aria-hidden="true" /> : 'Rejeitar'}
                    </ActionButton>
                  </ActionsRow>
                </CardBody>
              </Card>
            ))}
          </CardsGrid>
        )}

        {pagination && comments.length > 0 && (
          <PaginationRow>
            <PaginationButton type="button" onClick={handlePrevPage} disabled={!pagination.hasPrevPage}>
              Página anterior
            </PaginationButton>
            <span>{paginationLabel}</span>
            <PaginationButton type="button" onClick={handleNextPage} disabled={!pagination.hasNextPage}>
              Próxima página
            </PaginationButton>
          </PaginationRow>
        )}
      </Content>
    </PageWrapper>
  );
};
