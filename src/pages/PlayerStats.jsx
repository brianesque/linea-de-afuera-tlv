import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Target, TrendingUp, Award, BarChart3 } from "lucide-react";

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
      const teamMatches = matches.filter(m => 
        (m.equipo1_id === team.id || m.equipo2_id === team.id) && m.estado === 'finalizado'
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-sky-600" />
            Estadísticas de Jugadores
          </h1>
          <p className="text-gray-600">
            Rendimiento detallado de todos los jugadores
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
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-64 bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => {
              const stats = getPlayerStats(player);
              return (
                <Card key={player.id} className="border-2 border-sky-100 hover:shadow-xl transition-all">
                  <CardHeader className="bg-gradient-to-br from-sky-100 to-blue-100 border-b-2 border-sky-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {player.nombre}
                      </CardTitle>
                      <Badge className={player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}>
                        {player.genero === "femenino" ? "F" : "M"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-500">Torneos</p>
                          <p className="text-xl font-bold text-gray-900">{stats.torneosParticipados}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-500">Campeonatos</p>
                          <p className="text-xl font-bold text-gray-900">{stats.campeonatos}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Partidos Jugados</span>
                          <span className="font-semibold text-gray-900">{stats.partidosJugados}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Partidos Ganados</span>
                          <span className="font-semibold text-green-600">{stats.partidosGanados}</span>
                        </div>
                        {stats.partidosJugados > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Win Rate</span>
                            <Badge className="bg-green-100 text-green-800">
                              {((stats.partidosGanados / stats.partidosJugados) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Sets</span>
                          <span className="font-semibold">
                            {stats.setsAFavor} - {stats.setsEnContra}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Puntos</span>
                          <span className="font-semibold">
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