import { useState, useRef, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  Send,
  Compass,
  Diamond,
  Flame,
  User,
  Leaf,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const quickSuggestions = [
  "How do I create a group?",
  "What's my contribution status?",
  "How do loans work?",
  "Explain interest rates",
];

export default function Chat() {
  const { user } = useAuth();
  const sendMessage = trpc.chat.sendMessage.useMutation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello ${user?.name || "there"}! I'm Khisa AI, your savings assistant. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const result = await sendMessage.mutateAsync({ message: userMessage });
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            Khisa AI Assistant
            <Diamond className="w-4 h-4 text-violet-500" />
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            Your smart savings companion
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "assistant" ? (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                <Compass className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "gradient-accent text-white rounded-br-sm"
                  : "bg-white card-shadow border border-border/50 rounded-bl-sm"
              }`}
            >
              <p className={`text-sm leading-relaxed ${msg.role === "user" ? "text-white" : "text-foreground"}`}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-white card-shadow border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-violet-500 animate-bounce" />
                <Leaf className="w-3 h-3 text-violet-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                <Leaf className="w-3 h-3 text-violet-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="px-3 py-1.5 bg-white rounded-full text-xs text-muted-foreground border border-border/50 hover:border-primary hover:text-primary transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

      {/* Input */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Khisa anything..."
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="gradient-accent rounded-full w-10 h-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
