import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  margin-top: auto;
  background-color: ${({ theme }) => theme.colors.gray[900]};
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const FooterTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: ${({ theme }) => theme.media.md}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BrandTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #ffffff;
`;

const BrandDescription = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const FooterLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.gray[400]};
  text-decoration: none;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #ffffff;
    text-decoration: underline;
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[700]};
  padding-top: 24px;
`;

const FooterNote = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterTop>
          <BrandBlock>
            <BrandTitle>TechBlog</BrandTitle>
            <BrandDescription>
              A modern blog platform for developers
            </BrandDescription>
          </BrandBlock>

          <FooterLinks>
            <FooterLink href="#about">About</FooterLink>
            <FooterLink href="#privacy">Privacy</FooterLink>
            <FooterLink href="#terms">Terms</FooterLink>
            <FooterLink href="#contact">Contact</FooterLink>
          </FooterLinks>
        </FooterTop>

        <FooterBottom>
          <FooterNote>
            © {new Date().getFullYear()} TechBlog. All rights reserved.
          </FooterNote>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};