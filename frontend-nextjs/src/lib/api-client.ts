const getApiUrl = () => {
  // Client-side: check window.__ENV__ first
  if (typeof window !== "undefined") {
    const env = (window as any).__ENV__;
    if (env?.NEXT_PUBLIC_API_URL) {
      return env.NEXT_PUBLIC_API_URL;
    }
    if (env?.NEXT_PUBLIC_SOCKET_URL) {
      return env.NEXT_PUBLIC_SOCKET_URL + "/api";
    }
  }
  // Server-side or fallback: use process.env
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NEXT_PUBLIC_SOCKET_URL
      ? process.env.NEXT_PUBLIC_SOCKET_URL + "/api"
      : null) ||
    "http://localhost:5000/api"
  );
};

class ApiClient {
  private getBaseUrl(): string {
    return getApiUrl();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.getBaseUrl()}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ success: boolean; token: string; user: unknown }>(
      "/auth/login",
      { email, password },
    ),

  register: (name: string, email: string, password: string) =>
    apiClient.post<{ success: boolean; token: string; user: unknown }>(
      "/auth/register",
      { name, email, password },
    ),

  getCurrentUser: () =>
    apiClient.get<{ success: boolean; user: unknown }>("/auth/me"),

  refreshToken: () =>
    apiClient.post<{ success: boolean; token: string; user: unknown }>(
      "/auth/refresh",
    ),

  updatePreferences: (data: { defaultModel?: string; theme?: string }) =>
    apiClient.put<{ success: boolean; preferences: unknown }>(
      "/auth/update-preferences",
      data,
    ),
};

export const conversationsApi = {
  getAll: (params?: { archived?: boolean }) =>
    apiClient.get<{ success: boolean; conversations: unknown[] }>(
      "/conversations",
      params,
    ),

  create: (data: { title: string; model: string }) =>
    apiClient.post<{ success: boolean; conversation: unknown }>(
      "/conversations",
      data,
    ),

  getById: (id: string) =>
    apiClient.get<{ success: boolean; conversation: unknown }>(
      `/conversations/${id}`,
    ),

  update: (id: string, data: { title?: string; archived?: boolean }) =>
    apiClient.put<{ success: boolean; conversation: unknown }>(
      `/conversations/${id}`,
      data,
    ),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/conversations/${id}`),
};

export const messagesApi = {
  send: (data: { conversationId: string; content: string; model?: string }) =>
    apiClient.post<{
      success: boolean;
      userMessage: unknown;
      assistantMessage: unknown;
    }>("/messages", data),

  getByConversation: (conversationId: string) =>
    apiClient.get<{ success: boolean; messages: unknown[] }>(
      `/messages/${conversationId}`,
    ),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/messages/${id}`),
};
