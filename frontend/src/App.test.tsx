import React from 'react';
import { render, screen } from './test-utils';
import App from './App';

// Intentionally broken test for evaluation
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

// Another intentionally broken test
test('should fail - broken test for evaluation', () => {
  render(<App />);
  // This will fail because we don't have this text in our app
  const nonExistentElement = screen.getByText(/this text does not exist/i);
  expect(nonExistentElement).toBeInTheDocument();
});