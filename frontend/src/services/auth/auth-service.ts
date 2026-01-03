/**
 * Zitadel Authentication Service
 * Handles OIDC flow with PKCE for secure authentication
 */

import { config } from "../config";
import type { User, ZitadelTokenResponse, ZitadelUserInfo, PKCEPair } from "./auth-types";
import { AUTH_STORAGE_KEYS } from "./auth-types";

class AuthService {
  private authority: string;
  private clientId: string;
  private redirectUri: string;
  private postLogoutRedirectUri: string;
  private scope: string;

  constructor() {
    this.authority = config.zitadel.authority;
    this.clientId = config.zitadel.clientId;
    this.redirectUri = config.zitadel.redirectUri;
    this.postLogoutRedirectUri = config.zitadel.postLogoutRedirectUri;
    this.scope = config.zitadel.scope;
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  async generatePKCE(): Promise<PKCEPair> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = this.base64URLEncode(array);

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const codeChallenge = this.base64URLEncode(new Uint8Array(digest));

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate random state for CSRF protection
   */
  generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Base64 URL encode
   */
  private base64URLEncode(buffer: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  /**
   * Get Zitadel OIDC endpoints
   */
  getEndpoints() {
    return {
      authorization: `${this.authority}/oauth/v2/authorize`,
      token: `${this.authority}/oauth/v2/token`,
      userinfo: `${this.authority}/oidc/v1/userinfo`,
      logout: `${this.authority}/oidc/v1/end_session`,
    };
  }

  /**
   * Initiate login flow - redirect to Zitadel
   */
  async initiateLogin(): Promise<void> {
    const { codeVerifier, codeChallenge } = await this.generatePKCE();
    const state = this.generateState();

    // Store PKCE verifier and state for callback
    sessionStorage.setItem(AUTH_STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.STATE, state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${this.getEndpoints().authorization}?${params.toString()}`;
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback - exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<{ user: User; accessToken: string; idToken: string }> {
    // Verify state
    const storedState = sessionStorage.getItem(AUTH_STORAGE_KEYS.STATE);
    if (state !== storedState) {
      throw new Error("Invalid state parameter - possible CSRF attack");
    }

    // Get stored code verifier
    const codeVerifier = sessionStorage.getItem(AUTH_STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      throw new Error("Code verifier not found");
    }

    // Exchange code for tokens
    const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);

    // Get user info
    const userInfo = await this.getUserInfo(tokenResponse.access_token);

    // Map to our User type
    const user: User = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim(),
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      picture: userInfo.picture,
      emailVerified: userInfo.email_verified,
    };

    // Store tokens
    this.storeTokens(tokenResponse.access_token, tokenResponse.id_token, tokenResponse.refresh_token);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));

    // Clean up session storage
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.STATE);

    return {
      user,
      accessToken: tokenResponse.access_token,
      idToken: tokenResponse.id_token,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<ZitadelTokenResponse> {
    const response = await fetch(this.getEndpoints().token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.clientId,
        code: code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || "Failed to exchange code for tokens");
    }

    return response.json();
  }

  /**
   * Get user info from Zitadel
   */
  private async getUserInfo(accessToken: string): Promise<ZitadelUserInfo> {
    const response = await fetch(this.getEndpoints().userinfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    return response.json();
  }

  /**
   * Store tokens securely
   */
  private storeTokens(accessToken: string, idToken: string, refreshToken?: string): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.ID_TOKEN, idToken);
    if (refreshToken) {
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get stored ID token
   */
  getIdToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_STORAGE_KEYS.ID_TOKEN);
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(this.getEndpoints().token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.clientId,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      this.clearAuth();
      throw new Error("Failed to refresh token");
    }

    const tokenResponse: ZitadelTokenResponse = await response.json();
    this.storeTokens(tokenResponse.access_token, tokenResponse.id_token, tokenResponse.refresh_token);
  }

  /**
   * Logout - redirect to Zitadel logout
   */
  logout(): void {
    const idToken = this.getIdToken();
    this.clearAuth();

    const params = new URLSearchParams({
      id_token_hint: idToken || "",
      post_logout_redirect_uri: this.postLogoutRedirectUri,
    });

    window.location.href = `${this.getEndpoints().logout}?${params.toString()}`;
  }

  /**
   * Clear all auth data
   */
  clearAuth(): void {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  }

  /**
   * Link Zitadel user to Payload CMS user
   * This creates or updates a user in Payload CMS based on Zitadel identity
   */
  async linkToPayloadUser(accessToken: string): Promise<void> {
    try {
      const user = this.getUser();
      if (!user) return;

      const response = await fetch(`${config.api.baseUrl}/api/users/link-external`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          externalId: user.id,
          email: user.email,
          firstName: user.firstName || user.name?.split(" ")[0] || "",
          lastName: user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
          provider: "zitadel",
        }),
      });

      if (!response.ok) {
        console.warn("Failed to link user to Payload CMS:", await response.text());
      }
    } catch (error) {
      console.warn("Error linking user to Payload:", error);
    }
  }
}

export const authService = new AuthService();


