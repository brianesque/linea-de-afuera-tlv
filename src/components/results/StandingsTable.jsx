import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StandingsTable({ teams, matches, tournament }) {
  const standings = useMemo(() => {
    const stats = teams.map(team => {
      const teamMatches = matches.filter(m => 
        (m.equipo1_id === team.id || m.equipo2_id === team.id) && m.estado === 'finalizado'
      );

      let partidosJugados = teamMatches.length;
      let partidosGanados = 0;
      let partidosPerdidos = 0;
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
        } else if (teamSets < opponentSets) {
          partidosPerdidos++;
        }
      });

      return {
        team,
        partidosJugados,
        partidosGanados,
        partidosPerdidos,
        setsAFavor,
        setsEnContra,
        diferenciaSets: setsAFavor - setsEnContra,
        puntosAFavor,
        puntosEnContra,
        diferenciaPuntos: puntosAFavor - puntosEnContra
      };
    });

    // Ordenar según el criterio del torneo
    stats.sort((a, b) => {
      // Primero por criterio ganador
      if (tournament.criterio_ganador === 'sets') {
        if (b.setsAFavor !== a.setsAFavor) return b.setsAFavor - a.setsAFavor;
      } else {
        if (b.partidosGanados !== a.partidosGanados) return b.partidosGanados - a.partidosGanados;
      }

      // Luego por criterio de empate
      if (tournament.criterio_empate === 'diferencia_puntos') {
        if (b.diferenciaPuntos !== a.diferenciaPuntos) return b.diferenciaPuntos - a.diferenciaPuntos;
      } else {
        if (b.puntosAFavor !== a.puntosAFavor) return b.puntosAFavor - a.puntosAFavor;
      }

      // Finalmente por diferencia de sets
      return b.diferenciaSets - a.diferenciaSets;
    });

    return stats;
  }, [teams, matches, tournament]);

  const getMedalIcon = (position) => {
    if (position === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getPositionClass = (position) => {
    if (position === 0) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500";
    if (position === 1) return "bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400";
    if (position === 2) return "bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-700";
    return "";
  };

  return (
    <Card className="border-2 border-sky-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-sky-600" />
          Tabla de Posiciones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold w-16 text-center">#</TableHead>
                <TableHead className="font-bold">Equipo</TableHead>
                <TableHead className="font-bold text-center">PJ</TableHead>
                <TableHead className="font-bold text-center">PG</TableHead>
                <TableHead className="font-bold text-center">PP</TableHead>
                <TableHead className="font-bold text-center">Sets</TableHead>
                <TableHead className="font-bold text-center">Diff Sets</TableHead>
                <TableHead className="font-bold text-center">Puntos</TableHead>
                <TableHead className="font-bold text-center">Diff Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((stat, index) => (
                <TableRow key={stat.team.id} className={getPositionClass(index)}>
                  <TableCell className="text-center font-bold">
                    <div className="flex items-center justify-center gap-2">
                      {getMedalIcon(index)}
                      <span>{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    {stat.team.nombre}
                  </TableCell>
                  <TableCell className="text-center">{stat.partidosJugados}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-green-100 text-green-800">
                      {stat.partidosGanados}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-red-100 text-red-800">
                      {stat.partidosPerdidos}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {stat.setsAFavor} - {stat.setsEnContra}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={stat.diferenciaSets >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {stat.diferenciaSets > 0 ? '+' : ''}{stat.diferenciaSets}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {stat.puntosAFavor} - {stat.puntosEnContra}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={stat.diferenciaPuntos >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {stat.diferenciaPuntos > 0 ? '+' : ''}{stat.diferenciaPuntos}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}