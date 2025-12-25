import { useEffect, useState } from 'react';
import { MessageCircle, User, Send, ChevronLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { messageService, Message } from '../services/messageService';

interface Props {
  onBack: () => void;
}

export default function MessagesPage({ onBack }: Props) {
  const [searchParams] = useSearchParams();
  const preselectedUser = searchParams.get('user');

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const token = localStorage.getItem('access_token');

  const getCurrentUsername = () => {
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || '';
    } catch {
      return '';
    }
  };

  // Handle URL parameter changes
  useEffect(() => {
    if (preselectedUser) {
      console.log('Setting selected user from URL:', preselectedUser);
      setSelectedUser(preselectedUser);
    }
  }, [preselectedUser]);

  // Fetch available conversations when no user is selected
  useEffect(() => {
    if (selectedUser || !token) return;

    const fetchConversations = async () => {
      setLoadingConversations(true);
      try {
        const convos = await messageService.getAvailableConversations();
        setConversations(convos);
      } catch (e) {
        console.error('Failed to fetch conversations:', e);
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [selectedUser, token]);

  useEffect(() => {
    if (!selectedUser) return;
    if (!token) {
      console.error("No token. Login olman lazım.");
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const messages = await messageService.getDMMessages(selectedUser);
        setChat(messages);
      } catch (e) {
        console.error('Failed to fetch messages:', e);
        setChat([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, token]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !token || !selectedUser) return;

    const currentUsername = getCurrentUsername();
    setMessage('');

    // optimistic
    const optimistic: Message = {
      sender_username: currentUsername,
      receiver_username: selectedUser,
      conversation_id: '', // backend üretiyor, UI'da şart değil
      content: text,
      created_at: new Date().toISOString(),
    };
    setChat(prev => [...prev, optimistic]);

    try {
      await messageService.sendMessage(selectedUser, text);
      // istersen gönderince tekrar fetch yapıp DB'deki son hali çekebilirsin:
      // const messages = await messageService.getDMMessages(selectedUser);
      // setChat(messages);
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  // CHAT EKRANI
  if (selectedUser) {
    const currentUsername = getCurrentUsername();

    return (
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">{selectedUser}</h2>
              <p className="text-xs text-gray-500">Chat</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {loading && <p className="text-center text-gray-500">Loading messages...</p>}

          {!loading && chat.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-2">Start the conversation!</p>
            </div>
          )}

          {chat.map((m, i) => {
            const isMe = m.sender_username === currentUsername;
            return (
              <div key={m._id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-[70%] ${isMe ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                  <p className="text-sm">{m.content}</p>
                  {m.created_at && (
                    <p className={`text-xs mt-1 ${isMe ? 'text-amber-100' : 'text-gray-500'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    );
  }

  // CONVERSATION LIST SCREEN
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          Back to Home
        </button>
      </div>

      {loadingConversations ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((convo) => (
            <button
              key={convo.username}
              onClick={() => setSelectedUser(convo.username)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-amber-600" size={24} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="font-bold text-gray-900">{convo.name}</h3>
                {convo.last_message ? (
                  <p className="text-sm text-gray-500 truncate">
                    {convo.last_message.sender_username === getCurrentUsername() ? 'You: ' : ''}
                    {convo.last_message.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No messages yet</p>
                )}
              </div>
              {convo.last_message && (
                <div className="text-xs text-gray-400">
                  {new Date(convo.last_message.created_at).toLocaleDateString()}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-gray-500">No conversations yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Click "Message Host" on a reservation to start chatting
          </p>
        </div>
      )}
    </div>
  );
}
