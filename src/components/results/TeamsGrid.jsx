import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, TrendingUp, LayoutGrid, Table2, Download, Copy, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function TeamsGrid({ teams, allPlayers, tournament, tournamentId }) {
  const [viewMode, setViewMode] = useState("cards");
  const [isReorganizing, setIsReorganizing] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isAdmin = currentUser?.role === 'admin';

  const handleReorganize = async () => {
    setIsReorganizing(true);

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
      is_captain: tournament.capitanes_ids?.includes(p.id) || false
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un asistente que organiza equipos de beach vóley de manera equilibrada.

Datos:
- Número de equipos: ${numTeams}
- Jugadores por equipo: ${tournament.jugadores_por_equipo}
- Jugadores disponibles: ${JSON.stringify(playersData)}

Instrucciones:
1. Los jugadores marcados como "is_captain: true" DEBEN ser capitanes y estar en equipos diferentes.
2. Crea ${numTeams} equipos equilibrados basándote en las calificaciones (1-5).
3. IMPORTANTE: Distribuye las mujeres (genero: "femenino") de manera equitativa entre todos los equipos. Cada equipo debe tener aproximadamente la misma cantidad de mujeres.
4. Distribuye el resto de jugadores para que el promedio de calificación de cada equipo sea lo más similar posible.
5. Cada equipo debe tener exactamente ${tournament.jugadores_por_equipo} jugadores.

Responde SOLO con el JSON solicitado, sin explicaciones adicionales.`,
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
    let matchNumber = 1;
    const startTime = new Date(tournament.fecha_inicio);

    if (tournament.formato === 'todos_contra_todos') {
      for (let i = 0; i < newTeams.length; i++) {
        for (let j = i + 1; j < newTeams.length; j++) {
          const matchTime = new Date(startTime.getTime() + (matchNumber - 1) * tournament.duracion_partido_minutos * 60000);
          newMatches.push({
            tournament_id: tournamentId,
            equipo1_id: newTeams[i].id,
            equipo2_id: newTeams[j].id,
            numero_partido: matchNumber,
            horario_estimado: matchTime.toISOString(),
            estado: 'pendiente'
          });
          matchNumber++;
        }
      }
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
    let csv = "Equipo,Jugador,Género,Capitán,Promedio Equipo\n";
    
    teams.forEach(team => {
      const teamPlayers = team.jugadores_ids
        .map(id => allPlayers.find(p => p.id === id))
        .filter(Boolean);
      
      teamPlayers.forEach(player => {
        const isCaptain = player.id === team.capitan_id ? "Sí" : "No";
        const genero = player.genero === 'femenino' ? 'F' : 'M';
        csv += `"${team.nombre}","${player.nombre}",${genero},${isCaptain},${team.promedio_calificacion}\n`;
      });
    });

    navigator.clipboard.writeText(csv);
    toast.success("¡Copiado al portapapeles en formato CSV!");
  };

  const handleDownloadCSV = () => {
    let csv = "Equipo,Jugador,Género,Capitán,Promedio Equipo\n";
    
    teams.forEach(team => {
      const teamPlayers = team.jugadores_ids
        .map(id => allPlayers.find(p => p.id === id))
        .filter(Boolean);
      
      teamPlayers.forEach(player => {
        const isCaptain = player.id === team.capitan_id ? "Sí" : "No";
        const genero = player.genero === 'femenino' ? 'F' : 'M';
        csv += `"${team.nombre}","${player.nombre}",${genero},${isCaptain},${team.promedio_calificacion}\n`;
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={`rounded-none ${viewMode === "cards" ? "bg-sky-500 text-white" : ""}`}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`rounded-none ${viewMode === "table" ? "bg-sky-500 text-white" : ""}`}
                >
                  <Table2 className="w-4 h-4 mr-2" />
                  Tabla
                </Button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </Button>
              {isAdmin && tournament?.estado === 'equipos_armados' && (
                <Button
                  size="sm"
                  onClick={handleReorganize}
                  disabled={isReorganizing}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  {isReorganizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Reorganizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Reorganizar con IA
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div id="teams-display">
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => {
              const teamPlayers = team.jugadores_ids
                .map(id => allPlayers.find(p => p.id === id))
                .filter(Boolean);

              return (
                <Card key={team.id} className="border-2 border-sky-100 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="bg-gradient-to-br from-sky-100 to-blue-100 border-b-2 border-sky-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {team.nombre}
                        </CardTitle>
                        {isAdmin && (
                          <Badge className="bg-sky-500 text-white">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Promedio: {team.promedio_calificacion}
                          </Badge>
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
                              <Badge variant="outline" className="text-xs">
                                {player.genero === 'femenino' ? 'F' : 'M'}
                              </Badge>
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
                      <TableHead className="font-bold">Rol</TableHead>
                      {isAdmin && <TableHead className="font-bold">Promedio Equipo</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => {
                      const teamPlayers = team.jugadores_ids
                        .map(id => allPlayers.find(p => p.id === id))
                        .filter(Boolean);

                      return teamPlayers.map((player, idx) => {
                        const isCaptain = player.id === team.capitan_id;
                        return (
                          <TableRow key={`${team.id}-${player.id}`} className={idx === 0 ? "border-t-2 border-sky-200" : ""}>
                            {idx === 0 && (
                              <TableCell rowSpan={teamPlayers.length} className="font-semibold bg-sky-50">
                                {team.nombre}
                              </TableCell>
                            )}
                            <TableCell className={isCaptain ? "font-semibold text-amber-900" : ""}>
                              {player.nombre}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {player.genero === 'femenino' ? 'F' : 'M'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isCaptain && (
                                <Badge className="bg-amber-500 text-white">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Capitán
                                </Badge>
                              )}
                            </TableCell>
                            {isAdmin && idx === 0 && (
                              <TableCell rowSpan={teamPlayers.length} className="font-bold text-sky-600 bg-sky-50">
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