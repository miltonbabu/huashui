export type UserRole = 'user' | 'admin';

export type Theme = 'light' | 'dark' | 'auto';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  defaultModel: 'huashui-1' | 'huashui-reasoning';
  theme: Theme;
  totalMessages: number;
  totalTokens: number;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface UpdatePreferencesRequest {
  defaultModel?: 'huashui-1' | 'huashui-reasoning';
  theme?: Theme;
}
