import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Khisa, your Kitty savings assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to help! You can ask me about creating groups, making contributions, requesting loans, recording expenses, inviting members, understanding roles, or security questions.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 h-[calc(100vh-200px)] flex flex-col">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Khisa AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Ask questions about your chama, contributions, loans, and more.</p>
      </div>

      <div className="flex-1 bg-card rounded-[24px] border border-border p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-[16px] ${
                msg.sender === "user"
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground px-4 py-3 rounded-[16px]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Ask me anything about your chama..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          className="flex-1 h-12 rounded-[16px]"
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          className="rounded-[16px] font-bold px-6"
          disabled={isLoading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
