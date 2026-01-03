/**
 * GraphQL Client for Payload CMS
 */

import { config } from "../config";
import { authService } from "../auth/auth-service";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

class GraphQLClient {
  private baseUrl: string;
  private endpoint: string;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.endpoint = config.api.graphqlEndpoint;
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async execute<T = any>(
    query: string,
    variables?: Record<string, any>,
    options?: { includeAuth?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Include auth token if available and requested
    if (options?.includeAuth !== false) {
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${this.endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e) => e.message).join(", ");
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }

    return result.data as T;
  }

  /**
   * Execute a query (shorthand)
   */
  query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    return this.execute<T>(query, variables);
  }

  /**
   * Execute a mutation (shorthand)
   */
  mutation<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.execute<T>(mutation, variables, { includeAuth: true });
  }
}

export const graphqlClient = new GraphQLClient();


