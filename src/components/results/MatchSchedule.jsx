import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Download, Copy, LayoutGrid, Table2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MatchResultInput from "./MatchResultInput";

export default function MatchSchedule({ matches, teams, tournament, isAdmin }) {
  const [viewMode, setViewMode] = useState("table");

  const matchesByPhase = useMemo(() => {
    const groupMatches = matches.filter(m => m.fase === 'fase_grupos' || !m.fase);
    return {
      fase_grupos: groupMatches,
      grupo_a: groupMatches.filter(m => m.grupo === 'A'),
      grupo_b: groupMatches.filter(m => m.grupo === 'B'),
      semifinal: matches.filter(m => m.fase === 'semifinal'),
      final: matches.filter(m => m.fase === 'final')
    };
  }, [matches]);

  const hasGroups = matchesByPhase.grupo_a.length > 0 || matchesByPhase.grupo_b.length > 0;

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.nombre : "Equipo no encontrado";
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      en_juego: { label: 'En Juego', class: 'bg-blue-100 text-blue-800' },
      finalizado: { label: 'Finalizado', class: 'bg-green-100 text-green-800' }
    };
    return estados[estado] || estados.pendiente;
  };

  const handleCopyToClipboard = () => {
    let csv = "Fase,Partido,Equipo 1,Equipo 2,Hora Estimada,Set 1,Set 2,Set 3,Resultado\n";
    matches.forEach(match => {
      const fase = match.fase === 'semifinal' ? 'Semifinal' : match.fase === 'final' ? 'Final' : 'Fase de Grupos';
      const team1Name = getTeamName(match.equipo1_id);
      const team2Name = getTeamName(match.equipo2_id);
      const time = format(new Date(match.horario_estimado), "HH:mm", { locale: es });
      const set1 = match.estado === 'finalizado' ? `${match.set1_equipo1}-${match.set1_equipo2}` : '-';
      const set2 = match.estado === 'finalizado' ? `${match.set2_equipo1}-${match.set2_equipo2}` : '-';
      const set3 = match.estado === 'finalizado' && match.set3_equipo1 !== null ? `${match.set3_equipo1}-${match.set3_equipo2}` : '-';
      const resultado = match.estado === 'finalizado' ? `${match.sets_equipo1}-${match.sets_equipo2}` : '-';
      csv += `${fase},${match.numero_partido},"${team1Name}","${team2Name}",${time},${set1},${set2},${set3},${resultado}\n`;
    });

    navigator.clipboard.writeText(csv);
    toast.success("¡Fixture copiado al portapapeles!");
  };

  const handleDownloadCSV = () => {
    let csv = "Fase,Partido,Equipo 1,Equipo 2,Hora Estimada,Set 1,Set 2,Set 3,Resultado\n";
    matches.forEach(match => {
      const fase = match.fase === 'semifinal' ? 'Semifinal' : match.fase === 'final' ? 'Final' : 'Fase de Grupos';
      const team1Name = getTeamName(match.equipo1_id);
      const team2Name = getTeamName(match.equipo2_id);
      const time = format(new Date(match.horario_estimado), "HH:mm", { locale: es });
      const set1 = match.estado === 'finalizado' ? `${match.set1_equipo1}-${match.set1_equipo2}` : '-';
      const set2 = match.estado === 'finalizado' ? `${match.set2_equipo1}-${match.set2_equipo2}` : '-';
      const set3 = match.estado === 'finalizado' && match.set3_equipo1 !== null ? `${match.set3_equipo1}-${match.set3_equipo2}` : '-';
      const resultado = match.estado === 'finalizado' ? `${match.sets_equipo1}-${match.sets_equipo2}` : '-';
      csv += `${fase},${match.numero_partido},"${team1Name}","${team2Name}",${time},${set1},${set2},${set3},${resultado}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fixture_torneo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("¡Fixture descargado!");
  };

  const totalDuration = matches.length * (tournament.duracion_partido_minutos || 30);
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const MatchCard = ({ match }) => {
    const estadoBadge = getEstadoBadge(match.estado);
    const team1 = teams.find(t => t.id === match.equipo1_id);
    const team2 = teams.find(t => t.id === match.equipo2_id);
    const isFinal = match.fase === 'final';

    return (
      <Card className={`border-2 hover:shadow-lg transition-all ${isFinal ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50' : 'border-orange-100'}`}>
        <CardHeader className={`${isFinal ? 'bg-gradient-to-r from-yellow-100 to-amber-100' : 'bg-gradient-to-r from-orange-50 to-amber-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {isFinal && <Trophy className="w-5 h-5 text-yellow-600 inline mr-2" />}
                Partido #{match.numero_partido}
              </CardTitle>
              {match.fase && match.fase !== 'fase_grupos' && (
                <Badge className="bg-purple-500 text-white">
                  {match.fase === 'semifinal' ? 'Semifinal' : 'FINAL'}
                </Badge>
              )}
            </div>
            <Badge className={estadoBadge.class}>{estadoBadge.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(match.horario_estimado), "HH:mm", { locale: es })} hs</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
              <span className="font-semibold text-gray-900">{getTeamName(match.equipo1_id)}</span>
              {match.estado === 'finalizado' && (
                <div className="text-right">
                  <Badge className="bg-sky-600 text-white text-lg px-3 py-1">
                    {match.sets_equipo1}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="font-semibold text-gray-900">{getTeamName(match.equipo2_id)}</span>
              {match.estado === 'finalizado' && (
                <div className="text-right">
                  <Badge className="bg-orange-600 text-white text-lg px-3 py-1">
                    {match.sets_equipo2}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {match.estado === 'finalizado' && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Detalle por Sets:</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded p-2 border">
                  <p className="text-xs text-gray-500 mb-1">Set 1</p>
                  <p className="font-bold">{match.set1_equipo1} - {match.set1_equipo2}</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="text-xs text-gray-500 mb-1">Set 2</p>
                  <p className="font-bold">{match.set2_equipo1} - {match.set2_equipo2}</p>
                </div>
                {match.set3_equipo1 !== null && match.set3_equipo1 !== undefined && (
                  <div className="bg-white rounded p-2 border">
                    <p className="text-xs text-gray-500 mb-1">Set 3</p>
                    <p className="font-bold">{match.set3_equipo1} - {match.set3_equipo2}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && tournament?.estado !== 'finalizado' && (
            <div className="pt-2 border-t border-gray-200">
              <MatchResultInput match={match} team1={team1} team2={team2} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-orange-100">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={`rounded-none ${viewMode === "cards" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : ""}`}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`rounded-none ${viewMode === "table" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : ""}`}
                >
                  <Table2 className="w-4 h-4 mr-2" />
                  Tabla
                </Button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>Duración estimada: {hours}h {minutes}m</span>
              </div>
              {isAdmin && (
                <>
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
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "cards" ? (
        <div className="space-y-8">
          {/* Fase de Grupos - Si hay grupos definidos, mostrarlos por separado */}
          {hasGroups ? (
            <>
              {matchesByPhase.grupo_a.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-sky-500 rounded"></span>
                    Grupo A
                  </h2>
                  <div className="mb-4 p-4 bg-sky-50 rounded-lg border-2 border-sky-200">
                    <p className="font-semibold text-gray-900 mb-2">Equipos del Grupo A:</p>
                    <div className="flex flex-wrap gap-2">
                      {teams.filter(t => t.grupo === 'A').map(team => (
                        <Badge key={team.id} className="bg-sky-600 text-white">
                          {team.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchesByPhase.grupo_a.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {matchesByPhase.grupo_b.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-purple-500 rounded"></span>
                    Grupo B
                  </h2>
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="font-semibold text-gray-900 mb-2">Equipos del Grupo B:</p>
                    <div className="flex flex-wrap gap-2">
                      {teams.filter(t => t.grupo === 'B').map(team => (
                        <Badge key={team.id} className="bg-purple-600 text-white">
                          {team.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchesByPhase.grupo_b.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            matchesByPhase.fase_grupos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-sky-500 rounded"></span>
                  Fase de Grupos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchesByPhase.fase_grupos.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Semifinales */}
          {matchesByPhase.semifinal.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-purple-500 rounded"></span>
                Semifinales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchesByPhase.semifinal.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* Final */}
          {matchesByPhase.final.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                FINAL
              </h2>
              <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                {matchesByPhase.final.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-2 border-orange-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-orange-100 to-amber-100">
                    <TableHead className="font-bold">Fase</TableHead>
                    <TableHead className="font-bold">#</TableHead>
                    <TableHead className="font-bold">Equipo 1</TableHead>
                    <TableHead className="font-bold">Equipo 2</TableHead>
                    <TableHead className="font-bold">Hora</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="font-bold text-center">Set 1</TableHead>
                    <TableHead className="font-bold text-center">Set 2</TableHead>
                    <TableHead className="font-bold text-center">Set 3</TableHead>
                    <TableHead className="font-bold text-center">Resultado</TableHead>
                    {isAdmin && tournament?.estado !== 'finalizado' && (
                      <TableHead className="font-bold">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => {
                    const estadoBadge = getEstadoBadge(match.estado);
                    const team1 = teams.find(t => t.id === match.equipo1_id);
                    const team2 = teams.find(t => t.id === match.equipo2_id);
                    const fase = match.fase === 'semifinal' ? 'Semifinal' : 
                                 match.fase === 'final' ? 'FINAL' : 
                                 match.grupo ? `Grupo ${match.grupo}` : 'Grupos';

                    return (
                      <TableRow key={match.id} className={match.fase === 'final' ? 'bg-yellow-50' : ''}>
                        <TableCell>
                          <Badge className={
                            match.fase === 'final' ? 'bg-yellow-500 text-white' :
                            match.fase === 'semifinal' ? 'bg-purple-500 text-white' :
                            match.grupo === 'A' ? 'bg-sky-500 text-white' :
                            match.grupo === 'B' ? 'bg-purple-500 text-white' :
                            'bg-sky-500 text-white'
                          }>
                            {fase}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{match.numero_partido}</TableCell>
                        <TableCell>{getTeamName(match.equipo1_id)}</TableCell>
                        <TableCell>{getTeamName(match.equipo2_id)}</TableCell>
                        <TableCell>
                          {format(new Date(match.horario_estimado), "HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge className={estadoBadge.class}>{estadoBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {match.estado === 'finalizado' ? (
                            <span className="font-semibold">{match.set1_equipo1} - {match.set1_equipo2}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {match.estado === 'finalizado' ? (
                            <span className="font-semibold">{match.set2_equipo1} - {match.set2_equipo2}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {match.estado === 'finalizado' && match.set3_equipo1 !== null ? (
                            <span className="font-semibold">{match.set3_equipo1} - {match.set3_equipo2}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {match.estado === 'finalizado' ? (
                            <div className="flex items-center justify-center gap-3">
                              <Badge className="bg-sky-600 text-white">{match.sets_equipo1}</Badge>
                              <span className="text-gray-400">-</span>
                              <Badge className="bg-orange-600 text-white">{match.sets_equipo2}</Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        {isAdmin && tournament?.estado !== 'finalizado' && (
                          <TableCell>
                            <MatchResultInput match={match} team1={team1} team2={team2} />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}