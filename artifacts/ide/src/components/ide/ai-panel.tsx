import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Code2 } from "lucide-react";
import { useAiChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface IdeFile {
  id: number;
  name: string;
  content?: string | null;
  [key: string]: unknown;
}

interface AiPanelProps {
  activeFile: IdeFile | null;
}

export function AiPanel({ activeFile }: AiPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const aiChat = useAiChat();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || aiChat.isPending) return;

    const userMessage: ChatMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    aiChat.mutate(
      {
        data: {
          message: input,
          code: activeFile?.content ?? undefined,
          conversationHistory: messages
        }
      },
      {
        onSuccess: (response) => {
          setMessages(prev => [...prev, { role: "assistant", content: response.message }]);
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/30 border-l border-border/40">
      <div className="p-3 border-b border-border/40 shrink-0 bg-card/50 flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          AI Assistant
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm">
              I can help you write, explain, and debug your code.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 text-sm ${msg.role === 'assistant' ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'assistant' ? 'bg-card border border-border/50' : 'bg-primary text-primary-foreground'}`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        
        {aiChat.isPending && (
          <div className="flex gap-3 text-sm items-start">
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-primary/20 text-primary">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-card/50 border-t border-border/40 shrink-0">
        {activeFile && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded">
            <Code2 className="w-3 h-3" />
            Context: {activeFile.name}
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything..."
            className="min-h-[60px] max-h-[150px] pr-10 resize-none bg-background/50 border-border/50 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-1 bottom-1 h-8 w-8 text-primary hover:text-primary hover:bg-primary/20"
            disabled={!input.trim() || aiChat.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
