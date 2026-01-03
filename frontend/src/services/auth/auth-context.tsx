/**
 * Authentication Context Provider
 * Provides auth state and methods to the component tree
 */

import {
  component$,
  createContextId,
  useContextProvider,
  useStore,
  useVisibleTask$,
  Slot,
  type QRL,
  $,
} from "@builder.io/qwik";
import { authService } from "./auth-service";
import type { AuthState, User } from "./auth-types";

export interface AuthContextValue {
  state: AuthState;
  login: QRL<() => Promise<void>>;
  logout: QRL<() => void>;
  setUser: QRL<(user: User | null) => void>;
  setTokens: QRL<(accessToken: string | null, idToken: string | null) => void>;
  setLoading: QRL<(loading: boolean) => void>;
  setError: QRL<(error: string | null) => void>;
}

export const AuthContext = createContextId<AuthContextValue>("auth-context");

export const AuthProvider = component$(() => {
  const state = useStore<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    idToken: null,
    error: null,
  });

  const login = $(async () => {
    try {
      state.isLoading = true;
      state.error = null;
      await authService.initiateLogin();
    } catch (error) {
      state.error = error instanceof Error ? error.message : "Login failed";
      state.isLoading = false;
    }
  });

  const logout = $(() => {
    state.isAuthenticated = false;
    state.user = null;
    state.accessToken = null;
    state.idToken = null;
    authService.logout();
  });

  const setUser = $((user: User | null) => {
    state.user = user;
    state.isAuthenticated = !!user;
  });

  const setTokens = $((accessToken: string | null, idToken: string | null) => {
    state.accessToken = accessToken;
    state.idToken = idToken;
  });

  const setLoading = $((loading: boolean) => {
    state.isLoading = loading;
  });

  const setError = $((error: string | null) => {
    state.error = error;
  });

  // Initialize auth state on mount
  useVisibleTask$(() => {
    const user = authService.getUser();
    const accessToken = authService.getAccessToken();
    const idToken = authService.getIdToken();

    if (user && accessToken) {
      state.user = user;
      state.accessToken = accessToken;
      state.idToken = idToken;
      state.isAuthenticated = true;
    }

    state.isLoading = false;
  });

  const contextValue: AuthContextValue = {
    state,
    login,
    logout,
    setUser,
    setTokens,
    setLoading,
    setError,
  };

  useContextProvider(AuthContext, contextValue);

  return <Slot />;
});


