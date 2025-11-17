import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DashboardChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    const savedPrompt = localStorage.getItem('ai_system_prompt');
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    }
  }, []);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
    },
    onError: (error) => {
      toast.error("Fehler beim Senden der Nachricht");
      console.error(error);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    chatMutation.mutate({
      message: userMessage,
      context: "Dashboard - Projekt-Management-Assistent",
      systemPrompt: systemPrompt || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:bottom-6 md:right-6 bottom-20 right-4"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] shadow-2xl z-50 md:bottom-6 md:right-6 bottom-20 right-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">KI-Assistent</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          ✕
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription>
          Stellen Sie Fragen zu Ihren Projekten, Zeiterfassung oder anderen Funktionen
        </CardDescription>

        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 p-2 border rounded-md">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Starten Sie eine Unterhaltung</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted mr-8"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
          {chatMutation.isPending && (
            <div className="bg-muted p-3 rounded-lg mr-8">
              <p className="text-sm text-muted-foreground">Denkt nach...</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nachricht eingeben..."
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

