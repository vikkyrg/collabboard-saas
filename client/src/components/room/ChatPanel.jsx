import { useEffect, useState, useRef } from "react";
import socket from "../../services/socket";
import { getChatMessages } from "../../services/chatService";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function ChatPanel({ roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const loadMessages = async () => {
    try {
      const data = await getChatMessages(roomId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("chat_new", handleNewMessage);

    return () => {
      socket.off("chat_new", handleNewMessage);
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;

    socket.emit(
      "chat_msg",
      { roomId, text: message },
      (response) => {
        console.log(response);
      }
    );

    setMessage("");
  };

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC]">
      
      {/* Hidden header on desktop since it is in tabs now, but keeping for structural integrity if needed */}
      <div className="hidden border-b border-slate-200 p-4 bg-white shrink-0">
        <h2 className="font-bold text-slate-800">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col gap-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                <div className={`h-12 rounded-2xl skeleton ${i % 2 === 0 ? 'w-2/3 rounded-tr-sm' : 'w-3/4 rounded-tl-sm'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No messages yet</h3>
            <p className="text-sm">Start the conversation with your team.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isConsecutive = index > 0 && messages[index - 1].userId === msg.userId;
            const isMe = msg.userId === user?._id || msg.userId === user?.id;
            
            return (
              <div
                key={msg.messageId || `${msg.userId}-${msg.ts}`}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
              >
                {!isConsecutive && !isMe && (
                  <span className="text-xs font-semibold text-slate-500 ml-2 mb-1">
                    {msg.userName}
                  </span>
                )}
                <div className={`${isMe ? 'bg-blue-600 text-white border-blue-600 rounded-tr-sm' : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm'} border px-4 py-2.5 rounded-2xl max-w-[85%] shadow-sm`}>
                  <div className="flex items-end gap-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.ts && (
                      <span className={`text-[10px] shrink-0 mb-[-2px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-1 shadow-sm">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-3 text-sm text-slate-700"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors mb-0.5 mr-0.5 shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
