// Toggle between real Zitadel auth and mock auth for development
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

export { authService } from "./auth-service";
export { mockAuthService } from "./mock-auth-service";
export { AuthContext, AuthProvider } from "./auth-context";
export { useAuth, useAuthState, useIsAuthenticated, useUser } from "./auth-hooks";
export type { User, AuthState, AuthContextType } from "./auth-types";

// Export the appropriate service based on environment
import { authService as realAuthService } from "./auth-service";
import { mockAuthService } from "./mock-auth-service";

export const activeAuthService = USE_MOCK_AUTH ? mockAuthService : realAuthService;


