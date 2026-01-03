import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { useAuth } from "~/services/auth";

export default component$(() => {
  const auth = useAuth();

  useVisibleTask$(() => {
    auth.logout();
  });

  return (
    <div class="logout-page">
      <div class="loading-container">
        <div class="spinner-large" />
        <p>Signing out...</p>
      </div>

      <style>
        {`
        .logout-page {
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
  title: "Signing out...",
};


