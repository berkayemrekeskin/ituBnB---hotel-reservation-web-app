import React, { useState } from 'react';
import { Send, ChevronLeft } from 'lucide-react';

interface MessagesPageProps {
  onBack: () => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onBack }) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    { sender: 'host', text: "Hello! Thanks for your inquiry. The dates are available." },
    { sender: 'me', text: "Great, thanks for letting me know." }
  ]);

  const handleSend = () => {
    if (!message) return;
    setChat([...chat, { sender: 'me', text: message }]);
    setMessage("");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-100px)]">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 hover:text-black">
        <ChevronLeft size={20} /> Back
      </button>
      <div className="flex border border-gray-200 rounded-xl h-[600px] shadow-sm overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 hidden md:block">
          <div className="p-4 border-b font-medium">All conversations</div>
          <div className="p-4 bg-white border-b border-amber-100 cursor-pointer">
            <div className="font-semibold text-sm">Host (Emre)</div>
            <div className="text-xs text-gray-500 truncate">Great, thanks for letting me know.</div>
          </div>
        </div>
        {/* Chat Area */}
        <div className="w-full md:w-2/3 flex flex-col bg-white">
          <div className="p-4 border-b font-semibold flex justify-between">
            <span>Emre (Host)</span>

          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-xl text-sm ${msg.sender === 'me' ? 'bg-amber-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-amber-500"
              placeholder="Type a message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};