const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getAuthToken = (): string | null => {
  const storedAuth = localStorage.getItem("auth_token");
  if (storedAuth) return storedAuth;

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("access_token="));
  if (tokenCookie) return tokenCookie.split("=")[1];

  return null;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

type ChatbotApiResponse = {
  reply?: string;
  message?: string;
};

export const sendChatbotMessage = async (message: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/chatbot`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ message }),
  });

  const data = (await response.json().catch(() => ({}))) as ChatbotApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to get chatbot response");
  }

  if (!data.reply || typeof data.reply !== "string") {
    throw new Error("Invalid chatbot response");
  }

  return data.reply;
};