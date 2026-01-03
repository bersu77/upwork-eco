import { component$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { useAuth } from "~/services/auth";

export default component$(() => {
  const auth = useAuth();

  // Zitadel handles signup through the same OAuth flow
  // Users can register on the Zitadel login page
  return (
    <div class="auth-page">
      <div class="auth-card card">
        <h1>Create Account</h1>
        <p>Sign up for a new account using Zitadel.</p>

        {auth.state.error && <div class="error-message">{auth.state.error}</div>}

        <button
          class="btn btn-primary signup-btn"
          onClick$={auth.login}
          disabled={auth.state.isLoading}
        >
          {auth.state.isLoading ? (
            <>
              <span class="spinner" /> Redirecting...
            </>
          ) : (
            "Sign up with Zitadel"
          )}
        </button>

        <p class="login-link">
          Already have an account? <a href="/auth/login">Sign in</a>
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
        .signup-btn {
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
        .login-link {
          margin-top: 1rem;
          font-size: 0.875rem;
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sign Up - Shop PWA",
  meta: [{ name: "description", content: "Create a new account" }],
};


