import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

// Test consumer component
const TestConsumer = () => {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Logged Out'}</span>
      <span data-testid="user-email">{user ? user.email : 'No User'}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext Component & Provider Regression Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return fallback default context without crashing if used outside AuthProvider', () => {
    // Verifies crash fix: useAuth() returns fallback context with user: null rather than undefined
    render(<TestConsumer />);
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  it('should provide logged out state by default when wrapped inside AuthProvider', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  it('should render Navbar cleanly without crashing when wrapped in providers', () => {
    render(
      <AuthProvider>
        <LanguageProvider>
          <Navbar 
            activePage="citizen" 
            setActivePage={() => {}} 
            onOpenLoginModal={() => {}} 
            onOpenTicketLookup={() => {}} 
          />
        </LanguageProvider>
      </AuthProvider>
    );

    const matches = screen.getAllByText(/Societal Innovation/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
