import api from "./api";

export interface Message {
  _id?: string; // mongo string olarak da gelir
  sender_username: string;
  receiver_username: string;
  conversation_id: string;
  content: string;
  created_at?: string;
}

export const messageService = {
  // Tüm mesajlar (admin gibi) — lazım olmayabilir
  getAllMessages: async (): Promise<Message[]> => {
    const res = await api.get("/api/messages/");
    return res.data;
  },

  // ✅ DM konuşması (conversation_id bilmeye gerek yok)
  getDMMessages: async (otherUsername: string): Promise<Message[]> => {
    const res = await api.get(`/api/messages/dm/${encodeURIComponent(otherUsername)}`);
    return res.data;
  },

  // ✅ Mesaj gönder
  sendMessage: async (receiverUsername: string, content: string) => {
    const res = await api.post("/api/messages/", {
      receiver_username: receiverUsername,
      content,
    });
    return res.data;
  },

  // tek mesaj
  getMessage: async (messageId: string): Promise<Message> => {
    const res = await api.get(`/api/messages/${messageId}`);
    return res.data;
  },

  updateMessage: async (messageId: string, content: string) => {
    const res = await api.put(`/api/messages/${messageId}`, { content });
    return res.data;
  },

  deleteMessage: async (messageId: string) => {
    const res = await api.delete(`/api/messages/${messageId}`);
    return res.data;
  },

  // (istersen kullan) conversation_id ile çekme
  getConversationMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await api.get(`/api/messages/conversation/${encodeURIComponent(conversationId)}`);
    return res.data;
  },

  getUserMessages: async (username: string): Promise<Message[]> => {
    const res = await api.get(`/api/messages/user/${encodeURIComponent(username)}`);
    return res.data;
  },

  getAvailableConversations: async (): Promise<any[]> => {
  const res = await api.get("/api/messages/conversations");

  // ✅ Backend bazen object döndürür: {conversations: [...]}
  const data = res.data;

  if (Array.isArray(data)) return data;

  if (data?.conversations && Array.isArray(data.conversations)) return data.conversations;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items && Array.isArray(data.items)) return data.items;

  return [];
},

};

export default messageService;
