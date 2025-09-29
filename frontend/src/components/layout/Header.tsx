import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';

const HeaderContainer = styled.header`
  background-color: white;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  position: sticky;
  top: 0;
  z-index: 1000;
  /* Intentional performance issue: Missing will-change property */
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: ${({ theme }) => theme.media.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  text-decoration: none;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    text-decoration: none;
  }
`;

const NavLink = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  text-decoration: none;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[900]};
  }
`;

const NavGroup = styled.nav<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.media.md}) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    padding: ${({ theme }) => theme.space[3]} 0;
    border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
    display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background-color 0.2s ease-in-out;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const MobileMenuButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  display: none;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  @media (max-width: ${({ theme }) => theme.media.md}) {
    display: inline-flex;
  }
`;

// Botão reaproveitável com "variants" simples para manter consistência visual no topo da página.
const ActionButton = styled.button<{ $variant?: 'solid' | 'ghost' }>`
  border: ${({ $variant, theme }) =>
    $variant === 'ghost' ? '1px solid transparent' : '1px solid transparent'};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;

  ${({ $variant, theme }) =>
    $variant === 'ghost'
      ? `color: ${theme.colors.gray[700]};
         background: transparent;
         &:hover { background: ${theme.colors.gray[100]}; color: ${theme.colors.gray[700]}; }
        `
      : `background: ${theme.colors.primary[600]};
         color: #ffffff;
         &:hover { background: ${theme.colors.primary[700]}; color: #ffffff; }
        `};
`;

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const canModerate = user?.role === 'moderator' || user?.role === 'admin';

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const navId = 'primary-navigation';

  return (
    <HeaderContainer>
      <HeaderContent>
        <HeaderTop>
          <Logo to="/">TechBlog</Logo>
          <MobileMenuButton
            type="button"
            onClick={handleToggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls={navId}
          >
            Menu
          </MobileMenuButton>
        </HeaderTop>

        <NavGroup id={navId} $isOpen={isMenuOpen}>
          <NavLink to="/" onClick={() => setIsMenuOpen(false)}>
            Posts
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/create" onClick={() => setIsMenuOpen(false)}>
                Write
              </NavLink>
              {canModerate && (
                <NavLink to="/moderation/comments" onClick={() => setIsMenuOpen(false)}>
                  Moderação
                </NavLink>
              )}
              <UserMenu>
                <UserButton>
                  <Avatar>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
                  <UserName>{user?.username}</UserName>
                </UserButton>
              </UserMenu>
              <ActionButton $variant="ghost" onClick={handleLogout}>
                Sair
              </ActionButton>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setIsMenuOpen(false)}>
                Login
              </NavLink>
              <ActionButton as={Link} to="/register" onClick={() => setIsMenuOpen(false)}>
                Criar conta
              </ActionButton>
            </>
          )}
        </NavGroup>
      </HeaderContent>
    </HeaderContainer>
  );
};