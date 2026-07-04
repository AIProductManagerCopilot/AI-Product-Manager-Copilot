import axios from 'axios';

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

const STORAGE_KEY = 'ai_pm_copilot_auth_user';
const TOKEN_KEY = 'ai_pm_copilot_token';
const REFRESH_TOKEN_KEY = 'ai_pm_copilot_refresh_token';

// Axios instance ready for REST API backend connection
export const api = axios.create({
  baseURL: 'https://api.aipmcopilot.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper delay to simulate API latency
const delay = (ms: number = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  // Login with Email & Password
  async login(email: string, password: string, rememberMe: boolean = true): Promise<AuthResponse> {
    await delay(700);

    // Mock validation
    if (password === 'wrongpassword') {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    const mockUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      organization: 'Acme Product Labs',
      role: 'Product Manager',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    const token = 'jwt_token_header.' + btoa(JSON.stringify({ sub: mockUser.id, exp: Date.now() + 3600000 })) + '.signature';
    const refreshToken = 'refresh_' + Math.random().toString(36).substr(2, 16);

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    return { user: mockUser, token, refreshToken };
  },

  // Register user
  async register(data: {
    fullName: string;
    email: string;
    organization: string;
    role: string;
    password: string;
  }): Promise<AuthResponse> {
    await delay(900);

    const mockUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: data.fullName,
      email: data.email,
      organization: data.organization,
      role: data.role,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.email}`,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    const token = 'jwt_token_header.' + btoa(JSON.stringify({ sub: mockUser.id, exp: Date.now() + 3600000 })) + '.signature';
    const refreshToken = 'refresh_' + Math.random().toString(36).substr(2, 16);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    return { user: mockUser, token, refreshToken };
  },

  // Social OAuth Login Simulation (Google / GitHub)
  async loginWithOAuth(provider: 'google' | 'github'): Promise<AuthResponse> {
    await delay(800);

    const providerName = provider === 'google' ? 'Google User' : 'GitHub Developer';
    const mockUser: User = {
      id: `${provider}_usr_` + Math.random().toString(36).substr(2, 9),
      name: `${providerName}`,
      email: `user.${provider}@aipmcopilot.io`,
      organization: 'Enterprise AI Corp',
      role: 'Product Lead',
      avatarUrl: provider === 'google' 
        ? 'https://lh3.googleusercontent.com/a/default-user' 
        : 'https://github.githubassets.com/favicons/favicon.png',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    const token = 'jwt_oauth_' + provider + '_' + btoa(mockUser.id);
    const refreshToken = 'refresh_oauth_' + provider;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    return { user: mockUser, token, refreshToken };
  },

  // Send Password Reset Link
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    await delay(600);
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email}.`,
    };
  },

  // Reset Password
  async resetPassword(password: string): Promise<{ success: boolean; message: string }> {
    await delay(750);
    return {
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    };
  },

  // Verify Email token
  async verifyEmailToken(token: string): Promise<boolean> {
    await delay(700);
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.emailVerified = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    }
    return true;
  },

  // Refresh JWT Token
  async refreshToken(): Promise<string> {
    await delay(300);
    const newToken = 'jwt_refreshed_' + Date.now();
    localStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  },

  // Get currently logged-in user from storage
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
