import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trophy, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function PlayoffDialog({ tournament, matches, teams, onStart }) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const allGroupMatchesFinished = matches
    .filter(m => m.fase === 'fase_grupos')
    .every(m => m.estado === 'finalizado');

  const calculateStandings = () => {
    const stats = teams.map(team => {
      const teamMatches = matches.filter(m => 
        (m.equipo1_id === team.id || m.equipo2_id === team.id) && 
        m.estado === 'finalizado' &&
        m.fase === 'fase_grupos'
      );

      let partidosJugados = teamMatches.length;
      let partidosGanados = 0;
      let setsAFavor = 0;
      let setsEnContra = 0;
      let puntosAFavor = 0;
      let puntosEnContra = 0;

      teamMatches.forEach(match => {
        const isTeam1 = match.equipo1_id === team.id;
        const teamSets = isTeam1 ? match.sets_equipo1 : match.sets_equipo2;
        const opponentSets = isTeam1 ? match.sets_equipo2 : match.sets_equipo1;
        const teamPoints = isTeam1 ? match.puntos_equipo1 : match.puntos_equipo2;
        const opponentPoints = isTeam1 ? match.puntos_equipo2 : match.puntos_equipo1;

        setsAFavor += teamSets || 0;
        setsEnContra += opponentSets || 0;
        puntosAFavor += teamPoints || 0;
        puntosEnContra += opponentPoints || 0;

        if (teamSets > opponentSets) {
          partidosGanados++;
        }
      });

      return {
        team,
        partidosJugados,
        partidosGanados,
        setsAFavor,
        setsEnContra,
        diferenciaSets: setsAFavor - setsEnContra,
        puntosAFavor,
        puntosEnContra,
        diferenciaPuntos: puntosAFavor - puntosEnContra
      };
    });

    stats.sort((a, b) => {
      if (tournament.criterio_ganador === 'sets') {
        if (b.diferenciaSets !== a.diferenciaSets) return b.diferenciaSets - a.diferenciaSets;
      } else {
        if (b.partidosGanados !== a.partidosGanados) return b.partidosGanados - a.partidosGanados;
      }

      if (tournament.criterio_empate === 'diferencia_puntos') {
        if (b.diferenciaPuntos !== a.diferenciaPuntos) return b.diferenciaPuntos - a.diferenciaPuntos;
      } else {
        if (b.puntosAFavor !== a.puntosAFavor) return b.puntosAFavor - a.puntosAFavor;
      }

      return b.diferenciaSets - a.diferenciaSets;
    });

    return stats;
  };

  const getQualifiedTeams = () => {
    const standings = calculateStandings();
    
    if (tournament.jugar_semifinal) {
      return standings.slice(0, 4);
    } else if (tournament.jugar_final) {
      return standings.slice(0, 2);
    }
    return [];
  };

  const handleStartPlayoff = async () => {
    setIsProcessing(true);

    const qualified = getQualifiedTeams();
    const newMatches = [];
    let matchNumber = matches.length + 1;

    // Obtener el último horario de los partidos de fase de grupos
    const lastGroupMatch = matches
      .filter(m => m.fase === 'fase_grupos')
      .sort((a, b) => new Date(b.horario_estimado) - new Date(a.horario_estimado))[0];
    
    let nextTime = new Date(lastGroupMatch.horario_estimado);
    nextTime.setMinutes(nextTime.getMinutes() + tournament.duracion_partido_minutos);

    if (tournament.jugar_semifinal) {
      // Semifinal 1: 1ro vs 4to
      newMatches.push({
        tournament_id: tournament.id,
        equipo1_id: qualified[0].team.id,
        equipo2_id: qualified[3].team.id,
        numero_partido: matchNumber++,
        horario_estimado: nextTime.toISOString(),
        fase: 'semifinal',
        estado: 'pendiente'
      });

      nextTime = new Date(nextTime.getTime() + tournament.duracion_partido_minutos * 60000);

      // Semifinal 2: 2do vs 3ro
      newMatches.push({
        tournament_id: tournament.id,
        equipo1_id: qualified[1].team.id,
        equipo2_id: qualified[2].team.id,
        numero_partido: matchNumber++,
        horario_estimado: nextTime.toISOString(),
        fase: 'semifinal',
        estado: 'pendiente'
      });

      nextTime = new Date(nextTime.getTime() + tournament.duracion_partido_minutos * 60000);

      // Final (se llenará con los ganadores de semifinales - placeholder)
      newMatches.push({
        tournament_id: tournament.id,
        equipo1_id: qualified[0].team.id, // Placeholder
        equipo2_id: qualified[1].team.id, // Placeholder
        numero_partido: matchNumber++,
        horario_estimado: nextTime.toISOString(),
        fase: 'final',
        estado: 'pendiente'
      });
    } else if (tournament.jugar_final) {
      // Solo Final: 1ro vs 2do
      newMatches.push({
        tournament_id: tournament.id,
        equipo1_id: qualified[0].team.id,
        equipo2_id: qualified[1].team.id,
        numero_partido: matchNumber++,
        horario_estimado: nextTime.toISOString(),
        fase: 'final',
        estado: 'pendiente'
      });
    }

    await base44.entities.Match.bulkCreate(newMatches);
    await base44.entities.Tournament.update(tournament.id, {
      fase_actual: tournament.jugar_semifinal ? 'semifinal' : 'final'
    });

    queryClient.invalidateQueries({ queryKey: ['matches', tournament.id] });
    queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
    
    setIsProcessing(false);
    setOpen(false);
    toast.success("¡Fase final iniciada!");
    if (onStart) onStart();
  };

  const qualified = getQualifiedTeams();

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        disabled={!allGroupMatchesFinished}
        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
      >
        <Target className="w-5 h-5 mr-2" />
        Jugar Fase Final
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-purple-600" />
              Iniciar Fase Final
            </DialogTitle>
            <DialogDescription>
              {allGroupMatchesFinished ? (
                <div className="space-y-4 pt-4">
                  <p className="text-base">
                    Se creará la fase final con los equipos clasificados según el ranking actual.
                  </p>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">
                      {tournament.jugar_semifinal ? 'Equipos Clasificados (Semifinales + Final):' : 'Equipos Clasificados (Final):'}
                    </h3>
                    <div className="space-y-2">
                      {qualified.map((stat, index) => (
                        <div key={stat.team.id} className="flex items-center justify-between bg-white rounded p-3">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              index === 0 ? "bg-yellow-500 text-white" :
                              index === 1 ? "bg-gray-400 text-white" :
                              index === 2 ? "bg-amber-700 text-white" :
                              "bg-blue-500 text-white"
                            }>
                              {index + 1}°
                            </Badge>
                            <span className="font-semibold">{stat.team.nombre}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {tournament.criterio_ganador === 'sets' ? (
                              <span>Diff Sets: <strong>{stat.diferenciaSets > 0 ? '+' : ''}{stat.diferenciaSets}</strong></span>
                            ) : (
                              <span>PG: <strong>{stat.partidosGanados}</strong></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tournament.jugar_semifinal && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Enfrentamientos de Semifinal:</h3>
                      <div className="space-y-2">
                        <div className="bg-white rounded p-2 text-sm">
                          <strong>Semifinal 1:</strong> {qualified[0]?.team.nombre} vs {qualified[3]?.team.nombre}
                        </div>
                        <div className="bg-white rounded p-2 text-sm">
                          <strong>Semifinal 2:</strong> {qualified[1]?.team.nombre} vs {qualified[2]?.team.nombre}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-amber-700 pt-4">
                  Debes completar todos los partidos de la fase de grupos antes de iniciar la fase final.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          {allGroupMatchesFinished && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleStartPlayoff}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {isProcessing ? "Procesando..." : "Confirmar e Iniciar Fase Final"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}