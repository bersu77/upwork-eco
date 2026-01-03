/**
 * Matrix Chat Types
 */

export interface MatrixCredentials {
  userId: string;
  accessToken: string;
  deviceId: string;
  homeserverUrl: string;
}

export interface MatrixUser {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface MatrixMessage {
  eventId: string;
  roomId: string;
  sender: MatrixUser;
  content: string;
  timestamp: number;
  type: "text" | "image" | "file" | "notice";
}
 
export interface MatrixRoom {
  roomId: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  members: MatrixUser[];
  messages: MatrixMessage[];
  unreadCount: number;
}

export interface ChatState {
  isConnected: boolean;
  isConnecting: boolean;
  currentRoom: MatrixRoom | null;
  rooms: MatrixRoom[];
  messages: MatrixMessage[];
  error: string | null;
}

// Storage keys
export const MATRIX_STORAGE_KEYS = {
  CREDENTIALS: "matrix_credentials",
  SYNC_TOKEN: "matrix_sync_token",
} as const;


