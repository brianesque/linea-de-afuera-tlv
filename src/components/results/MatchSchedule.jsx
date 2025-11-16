import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Download, Copy, LayoutGrid, Table2 } from "lucide-react";
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
  const [viewMode, setViewMode] = useState("cards");

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
    let csv = "Partido,Equipo 1,Equipo 2,Hora Estimada\n";
    matches.forEach(match => {
      const team1Name = getTeamName(match.equipo1_id);
      const team2Name = getTeamName(match.equipo2_id);
      const time = format(new Date(match.horario_estimado), "HH:mm", { locale: es });
      csv += `${match.numero_partido},"${team1Name}","${team2Name}",${time}\n`;
    });

    navigator.clipboard.writeText(csv);
    toast.success("¡Fixture copiado al portapapeles!");
  };

  const handleDownloadCSV = () => {
    let csv = "Partido,Equipo 1,Equipo 2,Hora Estimada\n";
    matches.forEach(match => {
      const team1Name = getTeamName(match.equipo1_id);
      const team2Name = getTeamName(match.equipo2_id);
      const time = format(new Date(match.horario_estimado), "HH:mm", { locale: es });
      csv += `${match.numero_partido},"${team1Name}","${team2Name}",${time}\n`;
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

  return (
    <div className="space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => {
            const estadoBadge = getEstadoBadge(match.estado);
            const team1 = teams.find(t => t.id === match.equipo1_id);
            const team2 = teams.find(t => t.id === match.equipo2_id);

            return (
              <Card key={match.id} className="border-2 border-orange-100 hover:shadow-lg transition-all">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Partido #{match.numero_partido}</CardTitle>
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
                          <p className="text-xs text-gray-500 mt-1">{match.puntos_equipo1} pts</p>
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
                          <p className="text-xs text-gray-500 mt-1">{match.puntos_equipo2} pts</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && tournament?.estado !== 'finalizado' && (
                    <div className="pt-2 border-t border-gray-200">
                      <MatchResultInput match={match} team1={team1} team2={team2} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-orange-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-orange-100 to-amber-100">
                    <TableHead className="font-bold">#</TableHead>
                    <TableHead className="font-bold">Equipo 1</TableHead>
                    <TableHead className="font-bold">Equipo 2</TableHead>
                    <TableHead className="font-bold">Hora</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
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

                    return (
                      <TableRow key={match.id}>
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