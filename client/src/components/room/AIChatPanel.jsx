import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getAIHistory, chatWithAI } from "../../services/aiService";
import { Bot, Send, Loader2, Copy, Check, RefreshCw, Square } from "lucide-react";

function AIChatPanel({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const loadHistory = async () => {
    try {
      const data = await getAIHistory(roomId);
      setMessages(data.conversations || []);
    } catch (error) {
      console.error("Failed to load AI history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendQuestion = async (questionText) => {
    if (!questionText.trim() || isAsking) return;

    setInput("");
    
    // Optimistic UI for question
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: tempId, question: questionText, isTemp: true }
    ]);
    setIsAsking(true);

    try {
      // Capture whiteboard context
      let contextImage = null;
      const canvasElement = document.querySelector(".lower-canvas");
      if (canvasElement) {
        contextImage = canvasElement.toDataURL("image/png");
      }

      const data = await chatWithAI(questionText, roomId, contextImage);
      
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempId ? { ...msg, answer: data.answer, isTemp: false } : msg
        )
      );
    } catch (error) {
      console.error("Failed to chat with AI:", error);
      const errorMessage = error?.response?.data?.message || "Error generating response.";
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempId ? { ...msg, answer: `**Error:** ${errorMessage}`, isTemp: false } : msg
        )
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleSend = () => {
    sendQuestion(input);
  };

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">AI Assistant</h3>
            <p className="text-sm">Ask questions, generate ideas, or request diagrams based on the room's context.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id} className="space-y-4">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                  <div className="flex items-end gap-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.question}</p>
                    <span className="text-[10px] shrink-0 mb-[-2px] text-blue-200">
                      {new Date(parseInt(msg.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* AI Answer */}
              <div className="flex justify-start">
                <div className="max-w-[95%]">
                  <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                    <div className="prose prose-sm prose-slate max-w-none">
                      {msg.isTemp ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-sm font-medium ml-2">Thinking...</span>
                        </div>
                      ) : (
                        <ReactMarkdown
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  {...props}
                                  children={String(children).replace(/\n$/, '')}
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-md my-2"
                                />
                              ) : (
                                <code {...props} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs">
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.answer || ""}
                        </ReactMarkdown>
                      )}
                    </div>
                    {!msg.isTemp && (
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-slate-400">
                          {new Date(parseInt(msg.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  {!msg.isTemp && (
                    <div className="mt-2 flex items-center gap-2 justify-start text-slate-400 px-2">
                      <button 
                        onClick={() => handleCopy(msg.answer, msg.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors flex items-center"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      
                      {/* Only show regenerate for the last message */}
                      {index === messages.length - 1 && (
                        <button 
                          onClick={() => sendQuestion(msg.question)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors flex items-center"
                          title="Regenerate response"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-1 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI..."
            className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-3 text-sm text-slate-700 disabled:opacity-50"
            disabled={isAsking}
            rows={1}
          />
          {isAsking ? (
            <button
              disabled
              className="p-2.5 bg-slate-100 text-slate-400 rounded-xl mb-0.5 mr-0.5 shrink-0 border border-slate-200"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors mb-0.5 mr-0.5 shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-center mt-2 flex items-center justify-center">
          <span className="text-[10px] text-slate-400 font-medium">AI can make mistakes. Verify important information.</span>
        </div>
      </div>
    </div>
  );
}

export default AIChatPanel;
