
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Play, Trophy, CheckCircle2 } from "lucide-react";

export default function StartTournamentDialog({ tournament, tournamentId }) {
  const [open, setOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleStartTournament = async () => {
    setIsStarting(true);

    // Actualizar estado del torneo
    await base44.entities.Tournament.update(tournamentId, {
      estado: 'en_curso'
    });

    // Actualizar jugadores con este torneo
    const playerIds = tournament.jugadores_seleccionados || [];
    for (const playerId of playerIds) {
      const player = await base44.entities.Player.filter({ id: playerId });
      if (player && player.length > 0) {
        const currentPlayer = player[0];
        const torneosParticipados = currentPlayer.torneos_participados || [];
        if (!torneosParticipados.includes(tournamentId)) {
          await base44.entities.Player.update(playerId, {
            torneos_participados: [...torneosParticipados, tournamentId]
          });
        }
      }
    }

    // Guardar como template
    await base44.entities.TournamentTemplate.create({
      nombre: `${tournament.nombre} - Template`,
      jugadores_por_equipo: tournament.jugadores_por_equipo,
      cervezas_por_persona: tournament.cervezas_por_persona,
      snacks: tournament.snacks,
      bebidas_por_persona: tournament.bebidas_por_persona,
      formato: tournament.formato,
      criterio_ganador: tournament.criterio_ganador,
      criterio_empate: tournament.criterio_empate,
      duracion_partido_minutos: tournament.duracion_partido_minutos
    });

    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    
    setIsStarting(false);
    // The previous setOpen(false) was removed as per the outline.
    navigate(createPageUrl(`TournamentDetail?id=${tournamentId}`));
  };

  // No renderizar el botón si el torneo ya está en curso o finalizado
  if (tournament.estado === 'en_curso' || tournament.estado === 'finalizado') {
    return null;
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
      >
        <Play className="w-5 h-5 mr-2" />
        Iniciar Torneo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              ¿Iniciar el Torneo?
            </DialogTitle>
            <DialogDescription className="text-center">
              Al iniciar el torneo se realizarán las siguientes acciones:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Cambio de estado</p>
                <p className="text-sm text-gray-600">El torneo pasará a estado "En Curso"</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Actualización de jugadores</p>
                <p className="text-sm text-gray-600">Se registrará la participación de cada jugador</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Guardado como plantilla</p>
                <p className="text-sm text-gray-600">El formato se guardará para futuros torneos</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isStarting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartTournament}
              disabled={isStarting}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Confirmar e Iniciar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
