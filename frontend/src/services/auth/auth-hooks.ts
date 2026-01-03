/**
 * Authentication hooks for easy access to auth state and methods
 */

import { useContext } from "@builder.io/qwik";
import { AuthContext, type AuthContextValue } from "./auth-context";

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to access just the auth state
 */
export function useAuthState() {
  const { state } = useAuth();
  return state;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { state } = useAuth();
  return state.isAuthenticated;
}

/**
 * Hook to get current user
 */
export function useUser() {
  const { state } = useAuth();
  return state.user;
}


