import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function MatchResultInput({ match, team1, team2, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [sets1, setSets1] = useState(match.sets_equipo1 || 0);
  const [sets2, setSets2] = useState(match.sets_equipo2 || 0);
  const [points1, setPoints1] = useState(match.puntos_equipo1 || 0);
  const [points2, setPoints2] = useState(match.puntos_equipo2 || 0);
  const queryClient = useQueryClient();

  const updateMatchMutation = useMutation({
    mutationFn: (data) => base44.entities.Match.update(match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', match.tournament_id] });
      toast.success("¡Resultado actualizado!");
      setOpen(false);
      if (onUpdate) onUpdate();
    },
  });

  const handleSave = () => {
    updateMatchMutation.mutate({
      sets_equipo1: parseInt(sets1),
      sets_equipo2: parseInt(sets2),
      puntos_equipo1: parseInt(points1),
      puntos_equipo2: parseInt(points2),
      estado: 'finalizado'
    });
  };

  const handleStartMatch = () => {
    updateMatchMutation.mutate({
      estado: 'en_juego'
    });
  };

  return (
    <>
      {match.estado === 'pendiente' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStartMatch}
          className="border-green-500 text-green-700 hover:bg-green-50"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Iniciar
        </Button>
      ) : match.estado === 'en_juego' ? (
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          Ingresar Resultado
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-gray-300"
        >
          Editar Resultado
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado del Partido #{match.numero_partido}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-2">{team1?.nombre}</p>
                <Badge className="bg-sky-100 text-sky-800">Equipo 1</Badge>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-2">{team2?.nombre}</p>
                <Badge className="bg-orange-100 text-orange-800">Equipo 2</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Sets Ganados</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sets1">Equipo 1</Label>
                    <Input
                      id="sets1"
                      type="number"
                      min="0"
                      value={sets1}
                      onChange={(e) => setSets1(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sets2">Equipo 2</Label>
                    <Input
                      id="sets2"
                      type="number"
                      min="0"
                      value={sets2}
                      onChange={(e) => setSets2(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Puntos Totales</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points1">Equipo 1</Label>
                    <Input
                      id="points1"
                      type="number"
                      min="0"
                      value={points1}
                      onChange={(e) => setPoints1(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="points2">Equipo 2</Label>
                    <Input
                      id="points2"
                      type="number"
                      min="0"
                      value={points2}
                      onChange={(e) => setPoints2(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-emerald-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}