import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { useAuthState } from "~/services/auth";
import { matrixService, type MatrixMessage } from "~/services/matrix";
import { config } from "~/services/config";

export default component$(() => {
  const nav = useNavigate();
  const authState = useAuthState();

  const chatState = useStore({
    isConnected: false,
    isConnecting: false,
    messages: [] as MatrixMessage[],
    error: null as string | null,
    roomId: null as string | null,
  });

  const messageInput = useSignal("");
  const messagesEndRef = useSignal<HTMLDivElement>();

  // Redirect if not authenticated
  useVisibleTask$(async () => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      await nav("/auth/login");
    }
  });

  // Initialize Matrix connection
  useVisibleTask$(async () => {
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      chatState.isConnecting = true;
      chatState.error = null;

      // Login to Matrix (using guest access for demo)
      if (!matrixService.isLoggedIn()) {
        await matrixService.loginAsGuest(authState.user.name || authState.user.email);
      }

      // Join the default room
      const roomId = await matrixService.joinRoom(config.matrix.defaultRoomId);
      chatState.roomId = roomId;

      // Load existing messages
      const messages = await matrixService.getRoomMessages(roomId, 50);
      chatState.messages = messages;

      // Start real-time sync
      await matrixService.startSync();
      chatState.isConnected = true;

      // Subscribe to new messages
      matrixService.onMessage((message) => {
        if (message.roomId === chatState.roomId) {
          chatState.messages = [...chatState.messages, message];
        }
      });
    } catch (error) {
      console.error("Chat connection error:", error);
      chatState.error = error instanceof Error ? error.message : "Failed to connect to chat";
    } finally {
      chatState.isConnecting = false;
    }
  });

  // Scroll to bottom when new messages arrive
  useVisibleTask$(({ track }) => {
    track(() => chatState.messages.length);
    messagesEndRef.value?.scrollIntoView({ behavior: "smooth" });
  });

  const sendMessage = $(async () => {
    if (!messageInput.value.trim() || !chatState.roomId) return;

    try {
      await matrixService.sendMessage(chatState.roomId, messageInput.value.trim());
      messageInput.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  });

  const handleKeyPress = $((e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Not authenticated state
  if (!authState.isAuthenticated && !authState.isLoading) {
    return (
      <div class="container">
        <div class="auth-required">
          <h1>Login Required</h1>
          <p>You need to be logged in to access the chat.</p>
          <a href="/auth/login" class="btn btn-primary">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="container">
      <div class="chat-container">
        <div class="chat-header">
          <h1>Chat Room</h1>
          <div class="connection-status">
            {chatState.isConnecting ? (
              <span class="connecting">
                <span class="spinner-small" /> Connecting...
              </span>
            ) : chatState.isConnected ? (
              <span class="connected">● Connected</span>
            ) : (
              <span class="disconnected">○ Disconnected</span>
            )}
          </div>
        </div>

        {chatState.error && (
          <div class="error-banner">
            <p>{chatState.error}</p>
            <button
              class="btn btn-secondary"
              onClick$={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        <div class="messages-container">
          {chatState.messages.length === 0 && !chatState.isConnecting ? (
            <div class="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div class="messages-list">
              {chatState.messages.map((message) => {
                const isOwnMessage = message.sender.userId === matrixService.getUserId();
                return (
                  <div
                    key={message.eventId}
                    class={`message ${isOwnMessage ? "own" : ""}`}
                  >
                    <div class="message-header">
                      <span class="sender-name">
                        {message.sender.displayName || message.sender.userId}
                      </span>
                      <span class="timestamp">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div class="message-content">{message.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div class="message-input-container">
          <textarea
            class="message-input"
            placeholder="Type a message..."
            value={messageInput.value}
            onInput$={(e) => (messageInput.value = (e.target as HTMLTextAreaElement).value)}
            onKeyPress$={handleKeyPress}
            disabled={!chatState.isConnected}
            rows={1}
          />
          <button
            class="btn btn-primary send-btn"
            onClick$={sendMessage}
            disabled={!chatState.isConnected || !messageInput.value.trim()}
          >
            Send
          </button>
        </div>
      </div>

      <style>
        {`
        .auth-required {
          text-align: center;
          padding: 4rem 2rem;
        }
        .auth-required h1 {
          margin-bottom: 0.5rem;
        }
        .auth-required p {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .chat-container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 200px);
          min-height: 400px;
        }
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .chat-header h1 {
          font-size: 1.5rem;
          margin: 0;
        }
        .connection-status {
          font-size: 0.875rem;
        }
        .connecting {
          color: var(--warning);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .connected {
          color: var(--success);
        }
        .disconnected {
          color: var(--error);
        }
        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border);
          border-top-color: var(--warning);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .error-banner p {
          color: var(--error);
          margin: 0;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 1rem;
        }
        .no-messages {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
        }
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message {
          max-width: 70%;
          padding: 0.75rem 1rem;
          background: var(--background);
          border-radius: 1rem;
          border-bottom-left-radius: 0.25rem;
        }
        .message.own {
          margin-left: auto;
          background: var(--primary);
          color: white;
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 0.25rem;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
        }
        .sender-name {
          font-weight: 600;
        }
        .message.own .sender-name {
          color: rgba(255, 255, 255, 0.9);
        }
        .timestamp {
          color: var(--text-muted);
          font-size: 0.7rem;
        }
        .message.own .timestamp {
          color: rgba(255, 255, 255, 0.7);
        }
        .message-content {
          word-wrap: break-word;
          line-height: 1.4;
        }
        .message-input-container {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .message-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 1.5rem;
          font-family: inherit;
          font-size: 1rem;
          resize: none;
          min-height: 48px;
          max-height: 120px;
        }
        .message-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .message-input:disabled {
          background: var(--background);
          cursor: not-allowed;
        }
        .send-btn {
          border-radius: 1.5rem;
          padding: 0 1.5rem;
        }
        @media (max-width: 640px) {
          .message {
            max-width: 85%;
          }
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Chat - Shop PWA",
  meta: [{ name: "description", content: "Real-time chat for logged-in users" }],
};


