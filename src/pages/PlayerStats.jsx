import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Target, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PlayerStats() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: players, isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('nombre'),
    initialData: [],
  });

  const { data: allMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ['all_matches'],
    queryFn: () => base44.entities.Match.list(),
    initialData: [],
  });

  const { data: allTeams, isLoading: loadingTeams } = useQuery({
    queryKey: ['all_teams'],
    queryFn: () => base44.entities.Team.list(),
    initialData: [],
  });

  const { data: allTournaments, isLoading: loadingTournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list(),
    initialData: [],
  });

  const getPlayerStats = (player) => {
    const playerTeams = allTeams.filter(t => t.jugadores_ids?.includes(player.id));
    const tournamentIds = [...new Set(playerTeams.map(t => t.tournament_id))];
    
    let partidosJugados = 0;
    let partidosGanados = 0;
    let setsAFavor = 0;
    let setsEnContra = 0;
    let puntosAFavor = 0;
    let puntosEnContra = 0;
    let campeonatos = 0;

    playerTeams.forEach(team => {
      const teamMatches = allMatches.filter(m => 
        (m.equipo1_id === team.id || m.equipo2_id === team.id) && m.estado === 'finalizado'
      );

      teamMatches.forEach(match => {
        partidosJugados++;
        
        const isTeam1 = match.equipo1_id === team.id;
        const sets = isTeam1 ? match.sets_equipo1 : match.sets_equipo2;
        const setsContra = isTeam1 ? match.sets_equipo2 : match.sets_equipo1;
        const puntos = isTeam1 ? match.puntos_equipo1 : match.puntos_equipo2;
        const puntosContra = isTeam1 ? match.puntos_equipo2 : match.puntos_equipo1;

        setsAFavor += sets || 0;
        setsEnContra += setsContra || 0;
        puntosAFavor += puntos || 0;
        puntosEnContra += puntosContra || 0;

        if (match.ganador_id === team.id) {
          partidosGanados++;
        }
      });
    });

    // Contar campeonatos (si el jugador está en un equipo que ganó todos sus partidos en un torneo finalizado)
    tournamentIds.forEach(tournamentId => {
      const tournament = allTournaments.find(t => t.id === tournamentId && t.estado === 'finalizado');
      if (tournament) {
        const teamInTournament = playerTeams.find(t => t.tournament_id === tournamentId);
        if (teamInTournament) {
          const tournamentMatches = allMatches.filter(m => 
            m.tournament_id === tournamentId && 
            (m.equipo1_id === teamInTournament.id || m.equipo2_id === teamInTournament.id) &&
            m.estado === 'finalizado'
          );
          const wonAll = tournamentMatches.every(m => m.ganador_id === teamInTournament.id);
          if (wonAll && tournamentMatches.length > 0) {
            campeonatos++;
          }
        }
      }
    });

    return {
      torneosParticipados: tournamentIds.length,
      partidosJugados,
      partidosGanados,
      setsAFavor,
      setsEnContra,
      puntosAFavor,
      puntosEnContra,
      campeonatos
    };
  };

  const filteredPlayers = players.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = loadingPlayers || loadingMatches || loadingTeams || loadingTournaments;

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Estadísticas de Jugadores
          </h1>
          <p className="text-gray-600">
            Historial completo y desempeño de todos los jugadores
          </p>
        </div>

        <Card className="mb-6 border-2 border-sky-100 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPlayers.map((player) => {
            const stats = getPlayerStats(player);
            return (
              <Card key={player.id} className="border-2 border-sky-100 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="bg-gradient-to-br from-sky-100 to-blue-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {player.nombre}
                    </CardTitle>
                    {stats.campeonatos > 0 && (
                      <Badge className="bg-yellow-500 text-white">
                        <Trophy className="w-4 h-4 mr-1" />
                        {stats.campeonatos}x Campeón
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-gray-600">Torneos</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{stats.torneosParticipados}</p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-600">Partidos</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.partidosGanados}/{stats.partidosJugados}
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-gray-600">Sets</p>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        {stats.setsAFavor} - {stats.setsEnContra}
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-gray-600">Puntos</p>
                      </div>
                      <p className="text-lg font-bold text-orange-600">
                        {stats.puntosAFavor} - {stats.puntosEnContra}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}