import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, User, Send, ChevronLeft, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import messageService from "../services/messageService";

interface Props {
  onBack?: () => void;
}

type Conversation = {
  username: string;
  name?: string;
  last_message?: null | {
    content?: string;
    created_at?: string;
    sender_username?: string;
  };
};

export default function MessagesPage({ onBack }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedUser = searchParams.get("user");

  const [selectedUser, setSelectedUser] = useState<string | null>(preselectedUser);
  const [chat, setChat] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const [query, setQuery] = useState("");

  const token = localStorage.getItem("access_token");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentUsername = useMemo(() => {
    if (!token) return "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "";
    } catch {
      return "";
    }
  }, [token]);

  // ✅ URL ?user= değişince sync
  useEffect(() => {
    setSelectedUser(preselectedUser);
  }, [preselectedUser]);

  // ✅ Konuşma listesini çek (her zaman)
  useEffect(() => {
    if (!token) return;

    const fetchConversations = async () => {
      setLoadingConvos(true);
      try {
        const data = await messageService.getAvailableConversations();
        setConversations(Array.isArray(data) ? (data as Conversation[]) : []);
      } catch (e) {
        console.error("Failed to fetch conversations:", e);
        setConversations([]);
      } finally {
        setLoadingConvos(false);
      }
    };

    fetchConversations();
  }, [token]);

  // ✅ Seçili kullanıcı varsa chat'i çek
  useEffect(() => {
    if (!selectedUser || !token) return;

    const fetchMessages = async () => {
      setLoadingChat(true);
      try {
        const msgs = await messageService.getDMMessages(selectedUser);
        setChat(Array.isArray(msgs) ? msgs : []);
      } catch (e) {
        console.error("Failed to fetch messages:", e);
        setChat([]);
      } finally {
        setLoadingChat(false);
      }
    };

    fetchMessages();
  }, [selectedUser, token]);

  // ✅ Chat güncellenince en alta kaydır
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, selectedUser]);

  const openChat = (username: string) => {
    setSelectedUser(username);
    setSearchParams({ user: username });
  };

  const closeChatMobile = () => {
    // mobilde listeye dönmek için paramı temizleyelim
    setSelectedUser(null);
    setSearchParams({});
  };

  const handleSend = async () => {
  const text = message.trim();
  if (!text || !token || !selectedUser) return;

  setMessage("");

  const optimistic = {
    sender_username: currentUsername,
    receiver_username: selectedUser,
    content: text,
    created_at: new Date().toISOString(),
  };
  setChat(prev => [...prev, optimistic]);

  try {
    await messageService.sendMessage(selectedUser, text);
  } catch (e) {
    console.error("Failed to send message:", e);
    return; // gönderme başarısızsa listeyi refresh etmeye uğraşma
  }

  // ✅ konuşma listesini "best-effort" güncelle (asla crash etmesin)
  try {
    const updated = await messageService.getAvailableConversations();
    setConversations(Array.isArray(updated) ? updated : []);
  } catch (e) {
    console.warn("Could not refresh conversations (non-fatal):", e);
  }
};


  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => {
      const u = (c.username || "").toLowerCase();
      const n = (c.name || "").toLowerCase();
      const last = (c.last_message?.content || "").toLowerCase();
      return u.includes(q) || n.includes(q) || last.includes(q);
    });
  }, [conversations, query]);

  const selectedConversation = useMemo(() => {
    if (!selectedUser) return null;
    return conversations.find((c) => c.username === selectedUser) || null;
  }, [conversations, selectedUser]);

  // ===============================
  // UI
  // ===============================
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => onBack?.()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Home
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LEFT: Conversation list */}
        <div className={`md:col-span-1 border border-gray-200 rounded-2xl bg-white overflow-hidden ${selectedUser ? "hidden md:block" : ""}`}>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl">
              <Search size={16} className="text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search conversations..."
              />
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loadingConvos && (
              <div className="p-6 text-center text-gray-500">Loading conversations...</div>
            )}

            {!loadingConvos && filteredConversations.length === 0 && (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto mb-3 text-gray-300" size={44} />
                <div className="text-gray-600 font-medium">No conversations</div>
                <div className="text-sm text-gray-400 mt-1">
                  Click “Message Host” from a trip to start
                </div>
              </div>
            )}

            {!loadingConvos &&
              filteredConversations.map((c) => {
                const isActive = c.username === selectedUser;
                const last = c.last_message;
                return (
                  <button
                    key={c.username}
                    onClick={() => openChat(c.username)}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition flex gap-3 ${
                      isActive ? "bg-amber-50" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User size={18} className="text-gray-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold truncate">
                          {c.name || c.username}
                        </div>
                        <div className="text-xs text-gray-400 shrink-0">
                          {last?.created_at
                            ? new Date(last.created_at).toLocaleDateString([], { day: "2-digit", month: "short" })
                            : ""}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 truncate mt-0.5">
                        {last?.content || "—"}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* RIGHT: Chat area */}
        <div className={`md:col-span-2 border border-gray-200 rounded-2xl bg-white overflow-hidden ${!selectedUser ? "hidden md:block" : ""}`}>
          {/* Chat header */}
          <div className="p-4 border-b flex items-center gap-3">
            {/* Mobile back */}
            <button
              onClick={closeChatMobile}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <User size={18} className="text-amber-600" />
            </div>

            <div className="min-w-0">
              <div className="font-bold truncate">
                {selectedConversation?.name || selectedUser || "Select a conversation"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {selectedUser ? `@${selectedUser}` : "Pick a chat from the list"}
              </div>
            </div>
          </div>

          {/* Chat body */}
          <div className="h-[62vh] overflow-y-auto p-4 space-y-3 bg-white">
            {!selectedUser && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a conversation
              </div>
            )}

            {selectedUser && loadingChat && (
              <div className="text-center text-gray-500">Loading messages...</div>
            )}

            {selectedUser && !loadingChat && chat.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">Start the conversation!</p>
              </div>
            )}

            {selectedUser &&
              chat.map((m, i) => {
                const isMe = m?.sender_username === currentUsername;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                        isMe ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {m?.content ?? ""}
                      </div>
                      {m?.created_at && (
                        <div className={`text-xs mt-1 ${isMe ? "text-amber-100" : "text-gray-500"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-4 border-t flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder={selectedUser ? "Type your message..." : "Select a conversation first"}
              disabled={!selectedUser}
            />
            <button
              onClick={handleSend}
              disabled={!selectedUser || !message.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 rounded-full transition-colors flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Desktop empty-right state */}
        {!selectedUser && (
          <div className="hidden md:flex md:col-span-2 border border-gray-200 rounded-2xl bg-white items-center justify-center text-gray-500">
            Select a conversation from the left
          </div>
        )}
      </div>
    </div>
  );
}
