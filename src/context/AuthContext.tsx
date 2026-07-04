import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, remember?: boolean) => Promise<void>;
  registerUser: (data: { fullName: string; email: string; organization: string; role: string; password: string }) => Promise<void>;
  loginOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string, remember: boolean = true) => {
    const res = await authService.login(email, pass, remember);
    setUser(res.user);
  };

  const registerUser = async (data: { fullName: string; email: string; organization: string; role: string; password: string }) => {
    const res = await authService.register(data);
    setUser(res.user);
  };

  const loginOAuth = async (provider: 'google' | 'github') => {
    const res = await authService.loginWithOAuth(provider);
    setUser(res.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const verifyEmail = async (token: string) => {
    const success = await authService.verifyEmailToken(token);
    if (success && user) {
      setUser({ ...user, emailVerified: true });
    }
    return success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerUser,
        loginOAuth,
        logout,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
