import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  data?: Record<string, any>;
}

export default function ChatMessage({ role, content, timestamp, actions, data }: ChatMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`} data-testid={`message-${role}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isAssistant ? "bg-primary text-primary-foreground" : "bg-secondary"}>
          {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 space-y-2 ${isAssistant ? '' : 'flex flex-col items-end'}`}>
        <div className={`max-w-[85%] ${isAssistant ? '' : 'ml-auto'}`}>
          <div className={`rounded-md p-3 ${
            isAssistant 
              ? 'bg-card border border-card-border' 
              : 'bg-primary text-primary-foreground'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          
          {data && Object.keys(data).length > 0 && (
            <Card className="mt-2 p-3">
              <div className="space-y-1 text-xs font-mono">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {actions.map((action, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  data-testid={`button-chat-action-${idx}`}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground px-1">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
