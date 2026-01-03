/**
 * Application configuration
 * Environment variables should be set in .env file
 */

export const config = {
  // Payload CMS Backend
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
    graphqlEndpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT || "/api/shop-api/graphql",
  },

  // Zitadel OIDC Configuration
  zitadel: {
    authority: import.meta.env.VITE_ZITADEL_AUTHORITY || "https://your-zitadel-instance.zitadel.cloud",
    clientId: import.meta.env.VITE_ZITADEL_CLIENT_ID || "your-client-id",
    redirectUri: import.meta.env.VITE_ZITADEL_REDIRECT_URI || "http://localhost:5173/auth/callback",
    postLogoutRedirectUri: import.meta.env.VITE_ZITADEL_POST_LOGOUT_URI || "http://localhost:5173",
    scope: import.meta.env.VITE_ZITADEL_SCOPE || "openid profile email",
    responseType: "code",
  },

  // Matrix Chat Configuration
  matrix: {
    homeserverUrl: import.meta.env.VITE_MATRIX_HOMESERVER_URL || "https://matrix.org",
    defaultRoomId: import.meta.env.VITE_MATRIX_DEFAULT_ROOM_ID || "!your-room-id:matrix.org",
  },

  // PWA Configuration
  pwa: {
    name: "Shop PWA",
    shortName: "Shop",
    description: "Ecommerce PWA with Qwik",
    themeColor: "#2563eb",
    backgroundColor: "#f8fafc",
  },
};

export type Config = typeof config;

