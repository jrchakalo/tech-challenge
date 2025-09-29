import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import App from '../../App';
import { commentService } from '../../services/commentService';

const mockAuthState: any = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
};

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../services/commentService', () => ({
  commentService: {
    getModerationQueue: jest.fn(),
    approveComment: jest.fn(),
    rejectComment: jest.fn(),
    flagComment: jest.fn(),
  },
}));

jest.mock('../../services/realtime', () => ({
  connectRealtime: jest.fn(),
  subscribeToEvent: jest.fn(() => () => {}),
}));

jest.mock('../posts/HomePage', () => ({
  HomePage: () => <div>Feed principal</div>,
}));

describe('Proteção da rota de moderação', () => {
  const mockedCommentService = commentService as jest.Mocked<typeof commentService>;
  const emptyQueue = {
    comments: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
    mockedCommentService.getModerationQueue.mockResolvedValue(emptyQueue);
  });

  it('exibe o painel quando o usuário é moderador', async () => {
    mockAuthState.user = {
      id: 1,
      username: 'moderador',
      email: 'mod@example.com',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'moderator',
    };
    mockAuthState.isAuthenticated = true;

    render(<App />, { route: '/moderation/comments' });

    expect(
      await screen.findByRole('heading', { name: /moderação de comentários/i })
    ).toBeInTheDocument();
    expect(mockedCommentService.getModerationQueue).toHaveBeenCalledWith({ status: ['pending', 'flagged'] });
  });

  it('redireciona usuários sem permissão para o feed principal', async () => {
    mockAuthState.user = {
      id: 2,
      username: 'leitor',
      email: 'leitor@example.com',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'user',
    };
    mockAuthState.isAuthenticated = true;

    render(<App />, { route: '/moderation/comments' });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /moderação de comentários/i })
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText(/feed principal/i)).toBeInTheDocument();
  });
});
