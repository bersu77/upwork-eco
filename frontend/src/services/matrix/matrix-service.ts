/**
 * Matrix Chat Service
 * Handles Matrix protocol communication for real-time chat
 */

import { config } from "../config";
import type {
  MatrixCredentials,
  MatrixMessage,
  MatrixRoom,
  MatrixUser,
} from "./matrix-types";
import { MATRIX_STORAGE_KEYS } from "./matrix-types";

type MessageCallback = (message: MatrixMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class MatrixService {
  private homeserverUrl: string;
  private credentials: MatrixCredentials | null = null;
  private syncToken: string | null = null;
  private isSyncing: boolean = false;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private syncAbortController: AbortController | null = null;

  constructor() {
    this.homeserverUrl = config.matrix.homeserverUrl;
    this.loadStoredCredentials();
  }

  /**
   * Load stored credentials from localStorage
   */
  private loadStoredCredentials(): void {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(MATRIX_STORAGE_KEYS.CREDENTIALS);
    if (stored) {
      this.credentials = JSON.parse(stored);
    }

    const syncToken = localStorage.getItem(MATRIX_STORAGE_KEYS.SYNC_TOKEN);
    if (syncToken) {
      this.syncToken = syncToken;
    }
  }

  /**
   * Store credentials in localStorage
   */
  private storeCredentials(credentials: MatrixCredentials): void {
    this.credentials = credentials;
    localStorage.setItem(MATRIX_STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
  }

  /**
   * Check if user is logged in to Matrix
   */
  isLoggedIn(): boolean {
    return this.credentials !== null;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.credentials?.userId || null;
  }

  /**
   * Login to Matrix homeserver
   * For Zitadel integration, we use OpenID Connect token exchange
   */
  async login(accessToken: string, userId: string): Promise<MatrixCredentials> {
    // For OpenID Connect login with Zitadel token
    // The Matrix homeserver should be configured to accept OIDC tokens
    
    // Alternatively, use password login or token exchange
    // This example shows direct Matrix login - adjust based on your Matrix server setup
    
    const response = await fetch(`${this.homeserverUrl}/_matrix/client/v3/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "m.login.token",
        token: accessToken,
        // Or for OIDC:
        // type: "m.login.sso",
        // Alternative for password login:
        // type: "m.login.password",
        // identifier: { type: "m.id.user", user: userId },
        // password: password,
      }),
    });

    if (!response.ok) {
      // Fallback: Try to use guest access for demo purposes
      return this.loginAsGuest(userId);
    }

    const data = await response.json();

    const credentials: MatrixCredentials = {
      userId: data.user_id,
      accessToken: data.access_token,
      deviceId: data.device_id,
      homeserverUrl: this.homeserverUrl,
    };

    this.storeCredentials(credentials);
    this.notifyConnectionChange(true);

    return credentials;
  }

  /**
   * Login as guest (for demo/testing)
   */
  async loginAsGuest(displayName?: string): Promise<MatrixCredentials> {
    const response = await fetch(
      `${this.homeserverUrl}/_matrix/client/v3/register?kind=guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to login as guest to Matrix");
    }

    const data = await response.json();

    const credentials: MatrixCredentials = {
      userId: data.user_id,
      accessToken: data.access_token,
      deviceId: data.device_id,
      homeserverUrl: this.homeserverUrl,
    };

    this.storeCredentials(credentials);

    // Set display name if provided
    if (displayName) {
      await this.setDisplayName(displayName);
    }

    this.notifyConnectionChange(true);

    return credentials;
  }

  /**
   * Set user display name
   */
  async setDisplayName(displayName: string): Promise<void> {
    if (!this.credentials) throw new Error("Not logged in");

    await fetch(
      `${this.homeserverUrl}/_matrix/client/v3/profile/${encodeURIComponent(this.credentials.userId)}/displayname`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
        body: JSON.stringify({ displayname: displayName }),
      }
    );
  }

  /**
   * Logout from Matrix
   */
  async logout(): Promise<void> {
    if (this.credentials) {
      try {
        await fetch(`${this.homeserverUrl}/_matrix/client/v3/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
          },
        });
      } catch (e) {
        console.warn("Logout request failed:", e);
      }
    }

    this.stopSync();
    this.credentials = null;
    this.syncToken = null;
    localStorage.removeItem(MATRIX_STORAGE_KEYS.CREDENTIALS);
    localStorage.removeItem(MATRIX_STORAGE_KEYS.SYNC_TOKEN);
    this.notifyConnectionChange(false);
  }

  /**
   * Join a room
   */
  async joinRoom(roomIdOrAlias: string): Promise<string> {
    if (!this.credentials) throw new Error("Not logged in");

    const response = await fetch(
      `${this.homeserverUrl}/_matrix/client/v3/join/${encodeURIComponent(roomIdOrAlias)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join room");
    }

    const data = await response.json();
    return data.room_id;
  }

  /**
   * Get room messages
   */
  async getRoomMessages(roomId: string, limit: number = 50): Promise<MatrixMessage[]> {
    if (!this.credentials) throw new Error("Not logged in");

    const response = await fetch(
      `${this.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages?limit=${limit}&dir=b`,
      {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get room messages");
    }

    const data = await response.json();

    return data.chunk
      .filter((event: any) => event.type === "m.room.message")
      .map((event: any) => this.parseMessageEvent(event, roomId))
      .reverse();
  }

  /**
   * Send a text message
   */
  async sendMessage(roomId: string, content: string): Promise<string> {
    if (!this.credentials) throw new Error("Not logged in");

    const txnId = `m${Date.now()}`;

    const response = await fetch(
      `${this.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
        body: JSON.stringify({
          msgtype: "m.text",
          body: content,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send message");
    }

    const data = await response.json();
    return data.event_id;
  }

  /**
   * Start syncing for real-time updates
   */
  async startSync(): Promise<void> {
    if (this.isSyncing || !this.credentials) return;

    this.isSyncing = true;
    this.syncLoop();
  }

  /**
   * Stop syncing
   */
  stopSync(): void {
    this.isSyncing = false;
    if (this.syncAbortController) {
      this.syncAbortController.abort();
      this.syncAbortController = null;
    }
  }

  /**
   * Sync loop for real-time updates
   */
  private async syncLoop(): Promise<void> {
    while (this.isSyncing && this.credentials) {
      try {
        this.syncAbortController = new AbortController();

        const params = new URLSearchParams({
          timeout: "30000",
        });

        if (this.syncToken) {
          params.append("since", this.syncToken);
        } else {
          params.append("filter", JSON.stringify({ room: { timeline: { limit: 1 } } }));
        }

        const response = await fetch(
          `${this.homeserverUrl}/_matrix/client/v3/sync?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
            },
            signal: this.syncAbortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Sync failed");
        }

        const data = await response.json();
        this.syncToken = data.next_batch;
        localStorage.setItem(MATRIX_STORAGE_KEYS.SYNC_TOKEN, this.syncToken!);

        // Process room events
        if (data.rooms?.join) {
          for (const [roomId, roomData] of Object.entries(data.rooms.join)) {
            const room = roomData as any;
            if (room.timeline?.events) {
              for (const event of room.timeline.events) {
                if (event.type === "m.room.message") {
                  const message = this.parseMessageEvent(event, roomId);
                  this.notifyNewMessage(message);
                }
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Sync error:", error);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
  }

  /**
   * Parse a Matrix message event
   */
  private parseMessageEvent(event: any, roomId: string): MatrixMessage {
    return {
      eventId: event.event_id,
      roomId,
      sender: {
        userId: event.sender,
        displayName: event.sender.split(":")[0].substring(1),
      },
      content: event.content?.body || "",
      timestamp: event.origin_server_ts,
      type: this.getMessageType(event.content?.msgtype),
    };
  }

  /**
   * Get message type from Matrix msgtype
   */
  private getMessageType(msgtype: string): MatrixMessage["type"] {
    switch (msgtype) {
      case "m.image":
        return "image";
      case "m.file":
        return "file";
      case "m.notice":
        return "notice";
      default:
        return "text";
    }
  }

  /**
   * Subscribe to new messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to connection changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify message callbacks
   */
  private notifyNewMessage(message: MatrixMessage): void {
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  /**
   * Notify connection callbacks
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }
}

export const matrixService = new MatrixService();


