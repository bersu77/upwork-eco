import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate, useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { useAuth } from "~/services/auth";
import { authService } from "~/services/auth/auth-service";

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const auth = useAuth();

  useVisibleTask$(async () => {
    const params = new URLSearchParams(loc.url.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      auth.setError(errorDescription || error);
      await nav("/auth/login");
      return;
    }

    if (!code || !state) {
      auth.setError("Invalid callback parameters");
      await nav("/auth/login");
      return;
    }

    try {
      auth.setLoading(true);
      const result = await authService.handleCallback(code, state);

      auth.setUser(result.user);
      auth.setTokens(result.accessToken, result.idToken);

      // Link to Payload CMS user
      await authService.linkToPayloadUser(result.accessToken);

      await nav("/");
    } catch (err) {
      console.error("Auth callback error:", err);
      auth.setError(err instanceof Error ? err.message : "Authentication failed");
      await nav("/auth/login");
    } finally {
      auth.setLoading(false);
    }
  });

  return (
    <div class="callback-page">
      <div class="loading-container">
        <div class="spinner-large" />
        <p>Completing sign in...</p>
      </div>

      <style>
        {`
        .callback-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }
        .loading-container {
          text-align: center;
        }
        .spinner-large {
          width: 48px;
          height: 48px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Signing in...",
};


