import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "./ChatMessage";
import { Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; onClick: () => void; variant?: "default" | "outline" | "secondary" }>;
  data?: Record<string, any>;
}

interface ChatbotPanelProps {
  onSendMessage?: (message: string) => void;
  isProcessing?: boolean;
}

export default function ChatbotPanel({ onSendMessage, isProcessing = false }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your Grid AI Assistant. I can help you monitor feeders, analyze grid status, and activate DERs using Beckn Protocol. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    if (onSendMessage) {
      onSendMessage(input);
    }

    // TODO: remove mock functionality
    setTimeout(() => {
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you want to: "${input}". I'm analyzing the grid data now...`,
        timestamp: new Date(),
        actions: [
          {
            label: "View Details",
            variant: "outline",
            onClick: () => console.log("View details clicked")
          }
        ]
      };
      setMessages(prev => [...prev, mockResponse]);
    }, 1000);
  };

  const quickActions = [
    "Check all critical feeders",
    "Activate DERs for F-1234",
    "Show grid status",
    "List available DERs"
  ];

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Grid Assistant</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Beckn Protocol Enabled
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is analyzing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setInput(action)}
              data-testid={`button-quick-action-${idx}`}
            >
              {action}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about feeders, DERs, or grid status..."
            disabled={isProcessing}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
