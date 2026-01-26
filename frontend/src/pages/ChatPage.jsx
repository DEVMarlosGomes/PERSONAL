import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { MessageCircle, Send, User, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadConversations();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.user_id);
      // Poll for new messages every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        loadMessages(selectedConversation.user_id);
      }, 5000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.get("/chat/conversations");
      setConversations(response.data);
      // Auto-select first conversation for students
      if (user?.role === "student" && response.data.length > 0) {
        setSelectedConversation(response.data[0]);
      }
    } catch (error) {
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await api.get(`/chat/messages/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.post("/chat/messages", {
        receiver_id: selectedConversation.user_id,
        content: newMessage.trim()
      });
      setNewMessage("");
      loadMessages(selectedConversation.user_id);
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4" data-testid="chat-page">
        {/* Conversations List - Hidden on mobile when chat is open */}
        <Card className={`w-full md:w-80 bg-card border-border flex-shrink-0 ${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold uppercase flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Conversas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma conversa</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                        selectedConversation?.user_id === conv.user_id
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-secondary/50"
                      }`}
                      data-testid={`conversation-${conv.user_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">
                            {conv.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{conv.user_name}</p>
                            {conv.unread_count > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary text-xs flex items-center justify-center text-white">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className={`flex-1 bg-card border-border flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">
                    {selectedConversation.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{selectedConversation.user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === "personal" ? "Aluno" : "Personal Trainer"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.sender_id === user?.id
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-secondary rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user?.id ? "text-white/70" : "text-muted-foreground"
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="bg-secondary/50 border-white/10"
                    data-testid="chat-input"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} data-testid="send-message-btn">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p>Selecione uma conversa</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
