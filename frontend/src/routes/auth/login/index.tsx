import { component$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { useAuth, activeAuthService } from "~/services/auth";

export default component$(() => {
  const auth = useAuth();

  return (
    <div class="auth-page">
      <div class="auth-card card">
        <h1>Login</h1>
        <p>Sign in to your account</p>

        {auth.state.error && <div class="error-message">{auth.state.error}</div>}

        <button
          class="btn btn-primary login-btn"
          onClick$={async () => {
            try {
              await activeAuthService.initiateLogin();
            } catch (error) {
              console.error("Login error:", error);
            }
          }}
          disabled={auth.state.isLoading}
        >
          {auth.state.isLoading ? (
            <>
              <span class="spinner" /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p class="signup-link">
          Don't have an account? <a href="/auth/signup">Sign up</a>
        </p>
      </div>

      <style>
        {`
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }
        .auth-card {
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .auth-card h1 {
          margin-bottom: 0.5rem;
        }
        .auth-card p {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .login-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .error-message {
          background: #fef2f2;
          color: var(--error);
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        .signup-link {
          margin-top: 1rem;
          font-size: 0.875rem;
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Login - Shop PWA",
  meta: [{ name: "description", content: "Sign in to your account" }],
};


