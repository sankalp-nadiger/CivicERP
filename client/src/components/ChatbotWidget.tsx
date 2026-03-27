import React from "react";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChatbotMessage } from "@/services/chatbotService";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
};

const createMessage = (role: ChatRole, text: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  text,
  timestamp: Date.now(),
});

const formatTime = (time: number): string =>
  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    createMessage("bot", "Hello. I am CivicERP assistant. Ask me about complaint status or governance queries."),
  ]);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, createMessage("user", message)]);

    try {
      const reply = await sendChatbotMessage(message);
      setMessages((prev) => [...prev, createMessage("bot", reply)]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to reach chatbot right now. Please try again.";
      setMessages((prev) => [...prev, createMessage("bot", errorMessage)]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSend();
    }
  };

  const clearChat = () => {
    if (isLoading) return;
    setMessages([createMessage("bot", "Chat cleared. How can I help you now?")]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="w-[92vw] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-slate-900 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">CivicERP Assistant</p>
              {/* <p className="text-xs text-slate-300">RAG + status helper</p> */}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-slate-800"
                onClick={clearChat}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={listRef} className="max-h-[420px] space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-sm bg-slate-900 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      message.role === "user" ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-slate-500" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-b-2xl border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask a complaint question..."
                disabled={isLoading}
                className="h-10"
              />
              <Button type="button" onClick={() => void handleSend()} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Open chatbot"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}