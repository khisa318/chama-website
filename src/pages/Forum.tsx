import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare,
  Send,
  Heart,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Forum() {
  const { user } = useAuth();
  const { data: messages, refetch } = trpc.message.list.useQuery();
  const createMessage = trpc.message.create.useMutation({ onSuccess: () => refetch() });
  const likeMessage = trpc.message.like.useMutation({ onSuccess: () => refetch() });
  const deleteMessage = trpc.message.delete.useMutation({ onSuccess: () => refetch() });

  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim()) return;
    createMessage.mutate({ content: content.trim() }, {
      onSuccess: () => setContent(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Public Forum</h2>
          <p className="text-xs text-muted-foreground">Share feedback and connect with the community</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {([...(messages ?? [])].reverse()).map((msg) => {
          const isOwn = msg.userId === user?.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {msg.userName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isOwn
                      ? "gradient-accent text-white rounded-br-sm"
                      : "bg-white card-shadow border border-border/50 rounded-bl-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${isOwn ? "text-white/80" : "text-muted-foreground"}`}>
                      {msg.userName}
                    </span>
                    <span className={`text-[10px] ${isOwn ? "text-white/60" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className={`text-sm ${isOwn ? "text-white" : "text-foreground"}`}>{msg.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <button
                    onClick={() => likeMessage.mutate({ id: msg.id })}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-3 h-3" />
                    {msg.likes}
                  </button>
                  {isOwn && (
                    <button
                      onClick={() => deleteMessage.mutate({ id: msg.id })}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {(!messages || messages.length === 0) && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!content.trim() || createMessage.isPending}
          className="gradient-accent rounded-full w-10 h-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
