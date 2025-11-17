import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TournamentChat({ tournamentId, user }) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', tournamentId],
    queryFn: () => base44.entities.ChatMessage.filter({ tournament_id: tournamentId }, 'created_date'),
    refetchInterval: 3000, // Actualizar cada 3 segundos
  });

  const createMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', tournamentId] });
      setMessage("");
      setFile(null);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande (máx 10MB)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !file) return;

    let fileUrl = null;
    
    if (file) {
      setIsUploading(true);
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        fileUrl = result.file_url;
      } catch (error) {
        toast.error("Error al subir el archivo");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createMessageMutation.mutate({
      tournament_id: tournamentId,
      mensaje: message || "📎 Archivo adjunto",
      user_email: user?.email || "invitado@guest.com",
      user_name: user?.email || "Invitado",
      ...(fileUrl && { file_url: fileUrl })
    });
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
          Chat del Torneo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay mensajes aún</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.user_email === user?.email;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-semibold ${isOwnMessage ? 'text-slate-300' : 'text-slate-600'}`}>
                        {msg.user_name}
                      </p>
                      <p className={`text-xs ${isOwnMessage ? 'text-slate-400' : 'text-slate-500'}`}>
                        {format(new Date(msg.created_date), "HH:mm", { locale: es })}
                      </p>
                    </div>
                    <p className="text-sm break-words">{msg.mensaje}</p>
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs underline mt-2 block ${isOwnMessage ? 'text-slate-300' : 'text-slate-600'}`}
                      >
                        📎 Ver archivo
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4">
          {file && (
            <div className="mb-2 flex items-center gap-2 bg-slate-100 p-2 rounded text-xs">
              <Paperclip className="w-3 h-3" />
              <span className="flex-1 truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isUploading}
              className="text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={(!message.trim() && !file) || isUploading}
              className="bg-slate-700 hover:bg-slate-800 shrink-0"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}