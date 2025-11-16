import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function FinishTournamentDialog({ tournament, matches, onFinish }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const allMatchesFinished = matches.every(m => m.estado === 'finalizado');
  const pendingMatches = matches.filter(m => m.estado !== 'finalizado').length;

  const finishTournamentMutation = useMutation({
    mutationFn: () => base44.entities.Tournament.update(tournament.id, {
      estado: 'finalizado'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success("¡Torneo finalizado exitosamente!");
      setOpen(false);
      if (onFinish) onFinish();
    },
  });

  const handleFinish = () => {
    finishTournamentMutation.mutate();
  };

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        disabled={!allMatchesFinished}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
      >
        <Trophy className="w-5 h-5 mr-2" />
        Finalizar Torneo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-green-600" />
              Finalizar Torneo
            </DialogTitle>
            <DialogDescription>
              {allMatchesFinished ? (
                <div className="space-y-3 pt-4">
                  <p className="text-base">
                    ¿Estás seguro de que deseas finalizar el torneo <strong>{tournament.nombre}</strong>?
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Todos los partidos han sido completados</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      {matches.length} {matches.length === 1 ? 'partido finalizado' : 'partidos finalizados'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Una vez finalizado, el torneo quedará marcado como completado y aparecerá en el historial.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  <p className="text-base text-amber-700">
                    Aún quedan <strong>{pendingMatches}</strong> {pendingMatches === 1 ? 'partido' : 'partidos'} por completar.
                  </p>
                  <p className="text-sm text-gray-600">
                    Debes ingresar los resultados de todos los partidos antes de finalizar el torneo.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {allMatchesFinished && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleFinish}
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Confirmar Finalización
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}