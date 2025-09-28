import styled from 'styled-components';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

export const FormStatus = styled.div<{ $variant?: 'success' | 'error' | 'info' }>`
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[3]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return `background: ${theme.colors.green[50]}; color: ${theme.colors.green[700]}; border: 1px solid ${theme.colors.green[100]};`;
      case 'error':
        return `background: ${theme.colors.red[50]}; color: ${theme.colors.red[700]}; border: 1px solid ${theme.colors.red[100]};`;
      default:
        return `background: ${theme.colors.yellow[50]}; color: ${theme.colors.yellow[700]}; border: 1px solid ${theme.colors.yellow[100]};`;
    }
  }}
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  cursor: pointer;
`;

export const Input = styled.input.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.red[500]}20` : `${theme.colors.primary[500]}20`};
  }

  &:hover {
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[600]};
    background-color: ${({ theme }) => theme.colors.gray[50]};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

export const TextArea = styled.textarea.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.body};
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.red[500]}20` : `${theme.colors.primary[500]}20`};
  }

  &:hover {
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[600]};
    background-color: ${({ theme }) => theme.colors.gray[50]};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

export const Select = styled.select.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.red[500]}20` : `${theme.colors.primary[500]}20`};
  }

  &:hover {
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[600]};
    background-color: ${({ theme }) => theme.colors.gray[50]};
  }
`;

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.red[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const HelpText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const FieldFeedback = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const Spinner = styled.span`
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid ${({ theme }) => theme.colors.primary[100]};
  border-top-color: ${({ theme }) => theme.colors.primary[600]};
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Intentional CSS issue: File input styling problems
export const FileInput = styled.input.attrs({ type: 'file' })`
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
  border: 2px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.gray[50]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }

  &:hover {
  border-color: ${({ theme }) => theme.colors.primary[600]};
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }

  &::file-selector-button {
    margin-right: ${({ theme }) => theme.space[3]};
    border: 1px solid transparent;
    background: ${({ theme }) => theme.colors.primary[600]};
    padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: #ffffff;
    cursor: pointer;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    transition: background-color 0.2s ease-in-out;
  }

  &::file-selector-button:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  @media (max-width: ${({ theme }) => theme.media.md}) {
    &::file-selector-button {
      width: 100%;
      margin: 0 0 ${({ theme }) => theme.space[2]};
      text-align: center;
    }
  }
`;