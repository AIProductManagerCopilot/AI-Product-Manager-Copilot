import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
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
    // Set up Firebase Auth state observer
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const mappedUser = await authService.mapUser(firebaseUser);
          setUser(mappedUser);
        } catch (e) {
          console.error("Failed to map Firebase user on state change:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Unsubscribe on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const mappedUser = await authService.login(email, pass);
    setUser(mappedUser);
  };

  const registerUser = async (data: { fullName: string; email: string; organization: string; role: string; password: string }) => {
    const mappedUser = await authService.register(data);
    setUser(mappedUser);
  };

  const loginOAuth = async (provider: 'google' | 'github') => {
    const mappedUser = await authService.loginWithOAuth(provider);
    setUser(mappedUser);
  };

  const logout = async () => {
    await authService.logout();
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
