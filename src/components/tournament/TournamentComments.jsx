import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TournamentComments({ tournamentId, user }) {
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['tournament-comments', tournamentId],
    queryFn: () => base44.entities.TournamentComment.filter({ tournament_id: tournamentId }, '-created_date'),
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.TournamentComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-comments', tournamentId] });
      setComment("");
      setIsAnonymous(false);
      setNombre("");
      setEmail("");
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) return;

    const commentData = {
      tournament_id: tournamentId,
      comentario: comment,
      anonimo: isAnonymous
    };

    if (!isAnonymous) {
      if (user) {
        commentData.nombre = user.email;
        commentData.email = user.email;
      } else {
        commentData.nombre = nombre || "Usuario";
        commentData.email = email || "";
      }
    }

    createCommentMutation.mutate(commentData);
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
          <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
          Comentarios ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Comment Form */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <Textarea
            placeholder="Comparte tu experiencia del torneo..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-3 text-sm"
            rows={3}
          />
          
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer">
              Comentar de forma anónima
            </Label>
          </div>

          {!user && !isAnonymous && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Input
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="text-sm"
              />
              <Input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || createCommentMutation.isPending}
            className="bg-slate-700 hover:bg-slate-800 text-sm"
          >
            {createCommentMutation.isPending ? "Publicando..." : "Publicar Comentario"}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay comentarios todavía</p>
            </div>
          ) : (
            comments.map((comentario) => (
              <div key={comentario.id} className="border-b border-slate-200 pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-slate-900">
                        {comentario.anonimo ? "Anónimo" : comentario.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(comentario.created_date), "d MMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 break-words">{comentario.comentario}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}