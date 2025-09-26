import React from 'react';
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

const NavGroup = styled.nav`
  display: flex;
  align-items: center;
  gap: 16px;
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
         &:hover { background: ${theme.colors.gray[100]}; }
        `
      : `background: ${theme.colors.primary[600]};
         color: #ffffff;
         &:hover { background: ${theme.colors.primary[700]}; }
        `};
`;

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">TechBlog</Logo>

        <NavGroup>
          <NavLink to="/">Posts</NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/create">Write</NavLink>
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
              <NavLink to="/login">Login</NavLink>
              <ActionButton as={Link} to="/register">
                Criar conta
              </ActionButton>
            </>
          )}
        </NavGroup>
      </HeaderContent>
    </HeaderContainer>
  );
};