/**
 * Mock Authentication Service
 * Use this for development without Zitadel
 */

import type { User } from "./auth-types";
import { AUTH_STORAGE_KEYS } from "./auth-types";

class MockAuthService {
  /**
   * Mock login - simulates Zitadel login
   */
  async initiateLogin(): Promise<void> {
    // Simulate redirect delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create mock user
    const mockUser: User = {
      id: "mock-user-123",
      email: "demo@example.com",
      name: "Demo User",
      firstName: "Demo",
      lastName: "User",
      emailVerified: true,
    };

    // Generate mock tokens
    const mockAccessToken = "mock-access-token-" + Date.now();
    const mockIdToken = "mock-id-token-" + Date.now();

    // Store in localStorage
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, mockAccessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.ID_TOKEN, mockIdToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(mockUser));

    // Redirect to home
    window.location.href = "/";
  }

  /**
   * Mock logout
   */
  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    window.location.href = "/";
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
   * Mock callback handler
   */
  async handleCallback(): Promise<{ user: User; accessToken: string; idToken: string }> {
    const user = this.getUser();
    const accessToken = this.getAccessToken();
    const idToken = this.getIdToken();

    if (!user || !accessToken || !idToken) {
      throw new Error("No auth data found");
    }

    return { user, accessToken, idToken };
  }

  /**
   * Mock token refresh
   */
  async refreshAccessToken(): Promise<void> {
    // Do nothing for mock
  }

  /**
   * Mock user linking
   */
  async linkToPayloadUser(): Promise<void> {
    // Do nothing for mock
  }

  /**
   * Clear all auth data
   */
  clearAuth(): void {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  }
}

export const mockAuthService = new MockAuthService();

