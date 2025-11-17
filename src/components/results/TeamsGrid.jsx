import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Crown, Star, TrendingUp, LayoutGrid, Table2, Download, Copy, Sparkles, Trophy, Search, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function TeamsGrid({ teams, allPlayers, tournament, tournamentId, winnerTeamId }) {
  const [viewMode, setViewMode] = useState("table");
  const [isReorganizing, setIsReorganizing] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    
    return teams.filter(team => {
      // Buscar por nombre de equipo
      if (team.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      
      // Buscar por nombre de jugadores
      const teamPlayers = team.jugadores_ids
        .map(id => allPlayers.find(p => p.id === id))
        .filter(Boolean);
      
      return teamPlayers.some(player => 
        player.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [teams, allPlayers, searchTerm]);

  const handleReorganize = async () => {
    setIsReorganizing(true);

    const previousCaptains = teams.map(team => team.capitan_id);

    for (const team of teams) {
      await base44.entities.Team.delete(team.id);
    }

    const matches = await base44.entities.Match.filter({ tournament_id: tournamentId });
    for (const match of matches) {
      await base44.entities.Match.delete(match.id);
    }

    const selectedPlayers = allPlayers.filter(p => 
      tournament.jugadores_seleccionados.includes(p.id)
    );

    const numTeams = tournament.numero_equipos || Math.floor(selectedPlayers.length / tournament.jugadores_por_equipo);

    const playersData = selectedPlayers.map(p => ({
      id: p.id,
      nombre: p.nombre,
      calificacion: p.calificacion,
      genero: p.genero,
      is_captain: previousCaptains.includes(p.id)
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un asistente que organiza equipos de beach vóley de manera equilibrada.

Datos:
- Número de equipos: ${numTeams}
- Jugadores por equipo: ${tournament.jugadores_por_equipo}
- Jugadores disponibles: ${JSON.stringify(playersData)}

Instrucciones CRÍTICAS:
1. Los jugadores marcados como "is_captain: true" DEBEN ser capitanes y estar en equipos DIFERENTES.
2. Distribuye las MUJERES de manera EQUITATIVA en todos los equipos (mismo número de mujeres por equipo).
3. Luego equilibra por calificación para que el promedio de cada equipo sea similar.
4. Cada equipo debe tener exactamente ${tournament.jugadores_por_equipo} jugadores.

Responde SOLO con el JSON solicitado.`,
      response_json_schema: {
        type: "object",
        properties: {
          equipos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                numero: { type: "number" },
                jugadores_ids: {
                  type: "array",
                  items: { type: "string" }
                },
                capitan_id: { type: "string" }
              }
            }
          }
        }
      }
    });

    const animales = [
      { animal: "Tigres", origen: "Asia" },
      { animal: "Lobos", origen: "Europa" },
      { animal: "Delfines", origen: "Mediterráneo" },
      { animal: "Águilas", origen: "América" },
      { animal: "Leones", origen: "África" },
      { animal: "Osos", origen: "Norte América" },
      { animal: "Panteras", origen: "Amazonas" },
      { animal: "Halcones", origen: "Oriente" }
    ];

    const teamsToCreate = result.equipos.map((equipo, index) => {
      const animal = animales[index] || { animal: "Guerreros", origen: "TLV" };
      const jugadoresCalificaciones = equipo.jugadores_ids.map(id => {
        const player = playersData.find(p => p.id === id);
        return player ? player.calificacion : 3;
      });
      const promedio = jugadoresCalificaciones.reduce((a, b) => a + b, 0) / jugadoresCalificaciones.length;

      return {
        tournament_id: tournamentId,
        nombre: `Equipo ${equipo.numero} - ${animal.animal} de ${animal.origen}`,
        numero: equipo.numero,
        capitan_id: equipo.capitan_id,
        jugadores_ids: equipo.jugadores_ids,
        promedio_calificacion: parseFloat(promedio.toFixed(2))
      };
    });

    await base44.entities.Team.bulkCreate(teamsToCreate);

    const newTeams = await base44.entities.Team.filter({ tournament_id: tournamentId });
    const newMatches = [];
    const startTime = new Date(tournament.fecha_inicio);

    if (tournament.formato === 'todos_contra_todos') {
      // Crear todas las combinaciones de partidos
      const allMatches = [];
      for (let i = 0; i < newTeams.length; i++) {
        for (let j = i + 1; j < newTeams.length; j++) {
          allMatches.push({
            team1: newTeams[i],
            team2: newTeams[j]
          });
        }
      }

      // Algoritmo optimizado para evitar partidos consecutivos
      const orderedMatches = [];
      const teamLastPlayed = new Map(); // Maps team.id to the index in orderedMatches where it last played

      while (allMatches.length > 0) {
        let bestMatchIndex = -1;
        let bestScore = -1; // Maximize the minimum gap since last played

        for (let i = 0; i < allMatches.length; i++) {
          const match = allMatches[i];
          const team1LastPlayed = teamLastPlayed.get(match.team1.id) || -Infinity; // If never played, consider it played "long ago"
          const team2LastPlayed = teamLastPlayed.get(match.team2.id) || -Infinity;

          // Calculate the number of matches passed since each team last played
          // orderedMatches.length is the current "time" or index for the next match
          const minGapSinceLastPlayed = Math.min(
            orderedMatches.length - team1LastPlayed,
            orderedMatches.length - team2LastPlayed
          );

          if (minGapSinceLastPlayed > bestScore) {
            bestScore = minGapSinceLastPlayed;
            bestMatchIndex = i;
          }
        }

        if (bestMatchIndex >= 0) {
          const selectedMatch = allMatches.splice(bestMatchIndex, 1)[0]; // Remove the best match from the pool
          orderedMatches.push(selectedMatch);
          teamLastPlayed.set(selectedMatch.team1.id, orderedMatches.length - 1); // Update last played index
          teamLastPlayed.set(selectedMatch.team2.id, orderedMatches.length - 1);
        } else {
          // Fallback: If for some reason no good score is found (e.g., at the very beginning
          // or if all teams have played recently), just pick the first available match.
          if (allMatches.length > 0) {
            const selectedMatch = allMatches.splice(0, 1)[0];
            orderedMatches.push(selectedMatch);
            teamLastPlayed.set(selectedMatch.team1.id, orderedMatches.length - 1);
            teamLastPlayed.set(selectedMatch.team2.id, orderedMatches.length - 1);
          }
        }
      }

      orderedMatches.forEach((match, index) => {
        const matchTime = new Date(startTime.getTime() + index * tournament.duracion_partido_minutos * 60000);
        newMatches.push({
          tournament_id: tournamentId,
          equipo1_id: match.team1.id,
          equipo2_id: match.team2.id,
          numero_partido: index + 1,
          horario_estimado: matchTime.toISOString(),
          estado: 'pendiente'
        });
      });
    }

    if (newMatches.length > 0) {
      await base44.entities.Match.bulkCreate(newMatches);
    }

    queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] });
    queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
    
    setIsReorganizing(false);
    toast.success("¡Equipos reorganizados exitosamente!");
  };

  const handleCopyToClipboard = () => {
    let csv = "Equipo,Jugador,Género,Calificación,Rol,Promedio_Equipo\n";
    
    filteredTeams.forEach(team => {
      const teamPlayers = team.jugadores_ids
        .map(id => allPlayers.find(p => p.id === id))
        .filter(Boolean);
      
      teamPlayers.forEach(player => {
        const isCaptain = player.id === team.capitan_id ? "Capitán" : "Jugador";
        const genero = player.genero === "femenino" ? "F" : "M";
        csv += `"${team.nombre}","${player.nombre}",${genero},${player.calificacion},${isCaptain},${team.promedio_calificacion}\n`;
      });
    });

    navigator.clipboard.writeText(csv);
    toast.success("¡CSV copiado al portapapeles!");
  };

  const handleDownloadCSV = () => {
    let csv = "Equipo,Jugador,Género,Calificación,Rol,Promedio_Equipo\n";
    
    filteredTeams.forEach(team => {
      const teamPlayers = team.jugadores_ids
        .map(id => allPlayers.find(p => p.id === id))
        .filter(Boolean);
      
      teamPlayers.forEach(player => {
        const isCaptain = player.id === team.capitan_id ? "Capitán" : "Jugador";
        const genero = player.genero === "femenino" ? "F" : "M";
        csv += `"${team.nombre}","${player.nombre}",${genero},${player.calificacion},${isCaptain},${team.promedio_calificacion}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'equipos_torneo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("¡CSV descargado!");
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-sky-100">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar equipo o jugador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className={`rounded-none text-xs ${viewMode === "cards" ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white" : ""}`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={`rounded-none text-xs ${viewMode === "table" ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white" : ""}`}
                  >
                    <Table2 className="w-4 h-4 mr-1" />
                    Tabla
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCSV}
                      className="text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                  </>
                )}
                {tournament?.estado === 'equipos_armados' && isAdmin && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/organize-teams?id=${tournament.id}`}
                      className="bg-slate-600 hover:bg-slate-700 text-xs"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Rearmar Manual
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReorganize}
                      disabled={isReorganizing}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 text-xs"
                    >
                      {isReorganizing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                          ...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Reorganizar IA
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {searchTerm && (
              <p className="text-xs text-slate-600">
                Mostrando {filteredTeams.length} de {teams.length} equipos
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div id="teams-display">
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map((team) => {
              const teamPlayers = team.jugadores_ids
                .map(id => allPlayers.find(p => p.id === id))
                .filter(Boolean);
              const isWinner = winnerTeamId === team.id;

              return (
                <Card key={team.id} className={`border-2 shadow-lg hover:shadow-xl transition-all ${isWinner ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : 'border-sky-100'}`}>
                  <CardHeader className={`border-b-2 ${isWinner ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-200' : 'bg-gradient-to-br from-sky-100 to-blue-100 border-sky-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {team.nombre}
                          </CardTitle>
                          {isWinner && <Trophy className="w-6 h-6 text-yellow-500" />}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-sky-500 text-white">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Promedio: {team.promedio_calificacion}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {teamPlayers.map((player) => {
                        const isCaptain = player.id === team.capitan_id;
                        return (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                              isCaptain
                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCaptain && <Crown className="w-5 h-5 text-amber-600" />}
                              <span className={`font-semibold ${isCaptain ? 'text-amber-900' : 'text-gray-900'}`}>
                                {player.nombre}
                              </span>
                              <Badge className={`text-xs ${player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}`}>
                                {player.genero === "femenino" ? "F" : "M"}
                              </Badge>
                              {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                {[...Array(player.calificacion)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-2 border-sky-100 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-sky-100 to-blue-100">
                      <TableHead className="font-bold">Equipo</TableHead>
                      <TableHead className="font-bold">Jugador</TableHead>
                      <TableHead className="font-bold">Género</TableHead>
                      {isAdmin && <TableHead className="font-bold">Calificación</TableHead>}
                      <TableHead className="font-bold">Rol</TableHead>
                      {isAdmin && <TableHead className="font-bold">Promedio</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => {
                      const teamPlayers = team.jugadores_ids
                        .map(id => allPlayers.find(p => p.id === id))
                        .filter(Boolean);
                      const isWinner = winnerTeamId === team.id;

                      return teamPlayers.map((player, idx) => {
                        const isCaptain = player.id === team.capitan_id;
                        return (
                          <TableRow key={`${team.id}-${player.id}`} className={`${idx === 0 ? "border-t-2 border-sky-200" : ""} ${isWinner ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : ''}`}>
                            {idx === 0 && (
                              <TableCell rowSpan={teamPlayers.length} className={`font-semibold ${isWinner ? 'bg-yellow-50' : 'bg-sky-50'}`}>
                                <div className="flex items-center gap-2">
                                  {team.nombre}
                                  {isWinner && <Trophy className="w-5 h-5 text-yellow-500" />}
                                </div>
                              </TableCell>
                            )}
                            <TableCell className={isCaptain ? "font-semibold text-amber-900" : ""}>
                              <div className="flex items-center gap-2">
                                {player.nombre}
                                {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}`}>
                                {player.genero === "femenino" ? "F" : "M"}
                              </Badge>
                            </TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex gap-1">
                                  {[...Array(player.calificacion)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              {isCaptain && (
                                <Badge className="bg-amber-500 text-white">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Capitán
                                </Badge>
                              )}
                            </TableCell>
                            {isAdmin && idx === 0 && (
                              <TableCell rowSpan={teamPlayers.length} className={`font-bold text-sky-600 ${isWinner ? 'bg-yellow-50' : 'bg-sky-50'}`}>
                                {team.promedio_calificacion}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      });
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}