/**
 * Authentication types for Zitadel OIDC integration
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  emailVerified?: boolean;
  roles?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface ZitadelTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
  scope: string;
}

export interface ZitadelUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  preferred_username?: string;
}

// PKCE helpers
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

// Storage keys
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  ID_TOKEN: "auth_id_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER: "auth_user",
  CODE_VERIFIER: "auth_code_verifier",
  STATE: "auth_state",
} as const;


