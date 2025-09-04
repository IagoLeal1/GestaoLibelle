// components/chatbot/Chatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export function Chatbot() {
  const { firestoreUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: input }],
    };

    setHistory((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: history,
          message: input,
          userRole: firestoreUser?.profile?.role || null 
        }),
      });

      if (!res.ok) throw new Error("Falha na resposta da API");
      
      const data = await res.json();
      const modelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: data.text }],
      };

      setHistory((prev) => [...prev, modelMessage]);

    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "model",
        parts: [{ text: "Desculpe, estou com problemas para me conectar. Tente novamente mais tarde." }],
      };
      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-teal text-white p-4 rounded-full shadow-lg hover:bg-primary-teal/90 transition-transform transform hover:scale-110 active:scale-90"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] bg-white rounded-lg shadow-2xl flex flex-col z-50 animate-slide-in-bottom">
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-primary-teal text-white rounded-t-lg">
            <h3 className="font-semibold">Assistente Virtual</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Fechar chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {history.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary-teal text-white rounded-br-none'
                      : 'bg-support-light-gray text-primary-dark-blue rounded-bl-none'
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-2xl bg-support-light-gray text-primary-dark-blue rounded-bl-none animate-pulse">
                       Digitando...
                    </div>
                </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-teal"
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading} className="p-2 bg-primary-teal text-white rounded-full">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}