import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Award, BarChart3 } from "lucide-react";

export default function PlayerStats() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('nombre'),
    initialData: [],
  });

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list(),
    initialData: [],
  });

  const { data: teams } = useQuery({
    queryKey: ['all-teams'],
    queryFn: () => base44.entities.Team.list(),
    initialData: [],
  });

  const { data: matches } = useQuery({
    queryKey: ['all-matches'],
    queryFn: () => base44.entities.Match.list(),
    initialData: [],
  });

  const getPlayerStats = (player) => {
    const playerTournaments = tournaments.filter(t => 
      t.jugadores_seleccionados?.includes(player.id) && t.estado !== 'configuracion'
    );

    const playerTeams = teams.filter(team => 
      team.jugadores_ids?.includes(player.id)
    );

    let partidosJugados = 0;
    let partidosGanados = 0;
    let setsAFavor = 0;
    let setsEnContra = 0;
    let puntosAFavor = 0;
    let puntosEnContra = 0;
    let campeonatos = 0;

    playerTeams.forEach(team => {
      const teamTournament = tournaments.find(t => t.id === team.tournament_id);
      
      // Contar campeonatos ganados
      if (teamTournament?.estado === 'finalizado') {
        const finalMatch = matches.find(m => 
          m.tournament_id === team.tournament_id && 
          m.fase === 'final' && 
          m.estado === 'finalizado'
        );

        if (finalMatch) {
          const winnerId = finalMatch.sets_equipo1 > finalMatch.sets_equipo2 ? 
            finalMatch.equipo1_id : finalMatch.equipo2_id;
          if (winnerId === team.id) {
            campeonatos++;
          }
        } else {
          // Si no hay final, buscar al ganador por ranking
          const tournamentTeams = teams.filter(t => t.tournament_id === team.tournament_id);
          const tournamentMatches = matches.filter(m => 
            m.tournament_id === team.tournament_id && 
            m.estado === 'finalizado' &&
            m.fase === 'fase_grupos'
          );

          const stats = tournamentTeams.map(t => {
            const tMatches = tournamentMatches.filter(m => 
              m.equipo1_id === t.id || m.equipo2_id === t.id
            );

            let pg = 0, sa = 0, sc = 0, pa = 0, pc = 0;

            tMatches.forEach(match => {
              const isTeam1 = match.equipo1_id === t.id;
              const teamSets = isTeam1 ? match.sets_equipo1 : match.sets_equipo2;
              const opponentSets = isTeam1 ? match.sets_equipo2 : match.sets_equipo1;
              const teamPoints = isTeam1 ? match.puntos_equipo1 : match.puntos_equipo2;
              const opponentPoints = isTeam1 ? match.puntos_equipo2 : match.puntos_equipo1;

              sa += teamSets || 0;
              sc += opponentSets || 0;
              pa += teamPoints || 0;
              pc += opponentPoints || 0;

              if (teamSets > opponentSets) pg++;
            });

            return {
              teamId: t.id,
              pg,
              ds: sa - sc,
              pa,
              dp: pa - pc
            };
          });

          stats.sort((a, b) => {
            if (teamTournament.criterio_ganador === 'sets') {
              if (b.ds !== a.ds) return b.ds - a.ds;
            } else {
              if (b.pg !== a.pg) return b.pg - a.pg;
            }
            if (teamTournament.criterio_empate === 'diferencia_puntos') {
              if (b.dp !== a.dp) return b.dp - a.dp;
            } else {
              if (b.pa !== a.pa) return b.pa - a.pa;
            }
            return b.ds - a.ds;
          });

          if (stats[0]?.teamId === team.id) {
            campeonatos++;
          }
        }
      }

      // Contar partidos y estadísticas
      const teamMatches = matches.filter(m => 
        (m.equipo1_id === team.id || m.equipo2_id === team.id) && 
        m.estado === 'finalizado'
      );

      teamMatches.forEach(match => {
        partidosJugados++;
        
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
    });

    return {
      torneosParticipados: playerTournaments.length,
      partidosJugados,
      partidosGanados,
      setsAFavor,
      setsEnContra,
      puntosAFavor,
      puntosEnContra,
      campeonatos
    };
  };

  const filteredPlayers = players.filter(player =>
    player.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-slate-700" />
            <span>Estadísticas</span>
          </h1>
          <p className="text-sm text-slate-600">
            Rendimiento de jugadores
          </p>
        </div>

        <Card className="mb-4 border border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm border-slate-300"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-56 bg-slate-100" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPlayers.map((player) => {
              const stats = getPlayerStats(player);
              return (
                <Card key={player.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                  <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-900">
                        {player.nombre}
                      </CardTitle>
                      <Badge className={player.genero === "femenino" ? "bg-pink-100 text-pink-800 text-xs" : "bg-blue-100 text-blue-800 text-xs"}>
                        {player.genero === "femenino" ? "F" : "M"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-slate-600" />
                        <div>
                          <p className="text-xs text-slate-500">Torneos</p>
                          <p className="text-lg font-bold text-slate-900">{stats.torneosParticipados}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs text-slate-500">Campeonatos</p>
                          <p className="text-lg font-bold text-slate-900">{stats.campeonatos}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">Partidos Jugados</span>
                          <span className="font-semibold text-slate-900 text-sm">{stats.partidosJugados}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">Partidos Ganados</span>
                          <span className="font-semibold text-green-700 text-sm">{stats.partidosGanados}</span>
                        </div>
                        {stats.partidosJugados > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Win Rate</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {((stats.partidosGanados / stats.partidosJugados) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600">Sets</span>
                          <span className="font-semibold text-slate-900">
                            {stats.setsAFavor} - {stats.setsEnContra}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600">Puntos</span>
                          <span className="font-semibold text-slate-900">
                            {stats.puntosAFavor} - {stats.puntosEnContra}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}