import { useEffect, useState, useRef } from "react";
import socket from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { getChatMessages } from "../services/chatService";
import { Send, Loader2 } from "lucide-react";

function ChatPanel({ roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const feedEndRef = useRef(null);

  // Auto Scroll Engine
  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadMessages();

    // Stream Incoming Signals
    socket.on("chat_new", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("chat_new");
    };
  }, [roomId]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  const loadMessages = async () => {
    try {
      const data = await getChatMessages(roomId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to sync room log history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      socket.emit("chat_msg", {
        roomId,
        text: text.trim(),
      });
      setText("");
    } catch (error) {
      console.error("Transmission breakdown:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white text-[#04142C]">
      {/* Header Guard element */}
      <div className="border-b border-zinc-100 px-4 py-3 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Live Session Feed
        </h3>
      </div>

      {/* Message Matrix Field */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs font-semibold text-zinc-400">Feed is clear</p>
            <p className="text-[11px] text-zinc-400 max-w-[180px] mt-0.5">
              Send a baseline message to jumpstart session coordination.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === user?.id || msg.senderId === user?.id;
            return (
              <div
                key={msg.messageId || `msg-${index}-${Math.random()}`}
                className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                {/* Meta Sender Tag */}
                {!isMe && (
                  <span className="text-[10px] font-bold text-zinc-400 mb-1 ml-1">
                    {msg.userName || "Collaborator"}
                  </span>
                )}
                
                {/* Visual Capsule Layout */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm font-medium ${
                    isMe
                      ? "bg-[#04142C] text-white rounded-tr-none"
                      : "bg-zinc-100 text-[#04142C] rounded-tl-none border border-zinc-200/40"
                  }`}
                >
                  <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Text Delivery Engine Box */}
      <form onSubmit={handleSend} className="border-t border-zinc-100 p-3 bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#04142C]/10 focus-within:border-[#04142C] transition-all">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Broadcast to workspace..."
            className="flex-1 bg-transparent text-sm font-medium outline-none px-2 py-1 placeholder-zinc-400"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-[#04142C] text-white transition-all disabled:opacity-30 disabled:scale-100 hover:opacity-90 active:scale-95 shrink-0"
            title="Transmit message"
          >
            <Send size={14} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPanel;