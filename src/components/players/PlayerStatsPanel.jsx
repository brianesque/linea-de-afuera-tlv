import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Target, TrendingUp, Star, X, Users, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PlayerStatsPanel({
  players,
  selectedPlayerId,
  comparisonPlayerIds,
  onSelectPlayer,
  onToggleComparison,
  onClose,
  tournaments,
  teams,
  matches,
  isAdmin = false
}) {
  const getPlayerStats = (player) => {
    if (!player) return null;
    
    const playerTournaments = tournaments.filter(t => 
      t.jugadores_seleccionados?.includes(player.id) && t.estado !== 'configuracion'
    );

    const playerTeams = teams.filter(team => 
      team.jugadores_ids?.includes(player.id)
    );

    let partidosJugados = 0;
    let partidosGanados = 0;
    let partidosPerdidos = 0;
    let setsAFavor = 0;
    let setsEnContra = 0;
    let puntosAFavor = 0;
    let puntosEnContra = 0;
    let campeonatos = 0;

    playerTeams.forEach(team => {
      const teamTournament = tournaments.find(t => t.id === team.tournament_id);
      
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
        } else {
          partidosPerdidos++;
        }
      });
    });

    return {
      torneosParticipados: playerTournaments.length,
      partidosJugados,
      partidosGanados,
      partidosPerdidos,
      setsAFavor,
      setsEnContra,
      diferenciaSets: setsAFavor - setsEnContra,
      puntosAFavor,
      puntosEnContra,
      diferenciaPuntos: puntosAFavor - puntosEnContra,
      campeonatos,
      winRate: partidosJugados > 0 ? (partidosGanados / partidosJugados) * 100 : 0,
      promedioPuntosPorPartido: partidosJugados > 0 ? (puntosAFavor / partidosJugados).toFixed(1) : 0,
      promedioSetsPorPartido: partidosJugados > 0 ? (setsAFavor / partidosJugados).toFixed(2) : 0
    };
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const selectedStats = getPlayerStats(selectedPlayer);

  const comparisonPlayers = comparisonPlayerIds.map(id => {
    const player = players.find(p => p.id === id);
    return player ? { ...player, stats: getPlayerStats(player) } : null;
  }).filter(Boolean);

  // Tournament history for selected player
  const playerTournamentHistory = useMemo(() => {
    if (!selectedPlayer) return [];
    
    const playerTeamsList = teams.filter(team => 
      team.jugadores_ids?.includes(selectedPlayer.id)
    );

    return playerTeamsList.map(team => {
      const tournament = tournaments.find(t => t.id === team.tournament_id);
      if (!tournament || tournament.estado === 'configuracion') return null;

      const tournamentTeams = teams.filter(t => t.tournament_id === team.tournament_id);
      const teamMatches = matches.filter(m => 
        m.tournament_id === team.tournament_id &&
        (m.equipo1_id === team.id || m.equipo2_id === team.id) &&
        m.estado === 'finalizado'
      );

      // Calculate personal/team stats for this tournament
      let partidosJugados = 0;
      let partidosGanados = 0;
      let setsAFavor = 0;
      let setsEnContra = 0;
      let puntosAFavor = 0;
      let puntosEnContra = 0;

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

        if (teamSets > opponentSets) partidosGanados++;
      });

      // Determine phase reached and if champion
      let faseAlcanzada = 'Fase de Grupos';
      let esCampeon = false;

      const finalMatch = matches.find(m => 
        m.tournament_id === team.tournament_id && 
        m.fase === 'final' && 
        m.estado === 'finalizado'
      );

      const semiFinalMatches = matches.filter(m => 
        m.tournament_id === team.tournament_id && 
        m.fase === 'semifinal'
      );

      const teamInFinal = finalMatch && 
        (finalMatch.equipo1_id === team.id || finalMatch.equipo2_id === team.id);
      
      const teamInSemifinal = semiFinalMatches.some(m => 
        m.equipo1_id === team.id || m.equipo2_id === team.id
      );

      if (teamInFinal) {
        faseAlcanzada = 'Final';
        if (finalMatch.estado === 'finalizado') {
          const winnerId = finalMatch.sets_equipo1 > finalMatch.sets_equipo2 ? 
            finalMatch.equipo1_id : finalMatch.equipo2_id;
          if (winnerId === team.id) {
            esCampeon = true;
            faseAlcanzada = '🏆 Campeón';
          }
        }
      } else if (teamInSemifinal) {
        faseAlcanzada = 'Semifinal';
      } else if (tournament.estado === 'finalizado' && !finalMatch) {
        // No final match means winner determined by group stage
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

          return { teamId: t.id, pg, ds: sa - sc, pa, dp: pa - pc };
        });

        stats.sort((a, b) => {
          if (tournament.criterio_ganador === 'sets') {
            if (b.ds !== a.ds) return b.ds - a.ds;
          } else {
            if (b.pg !== a.pg) return b.pg - a.pg;
          }
          if (tournament.criterio_empate === 'diferencia_puntos') {
            if (b.dp !== a.dp) return b.dp - a.dp;
          } else {
            if (b.pa !== a.pa) return b.pa - a.pa;
          }
          return b.ds - a.ds;
        });

        if (stats[0]?.teamId === team.id) {
          esCampeon = true;
          faseAlcanzada = '🏆 Campeón';
        }
      }

      // Get team position in tournament
      const allTournamentMatches = matches.filter(m => 
        m.tournament_id === team.tournament_id && 
        m.estado === 'finalizado' &&
        m.fase === 'fase_grupos'
      );

      const teamStats = tournamentTeams.map(t => {
        const tMatches = allTournamentMatches.filter(m => 
          m.equipo1_id === t.id || m.equipo2_id === t.id
        );

        let pg = 0, sa = 0, sc = 0;
        tMatches.forEach(match => {
          const isTeam1 = match.equipo1_id === t.id;
          const teamSets = isTeam1 ? match.sets_equipo1 : match.sets_equipo2;
          const opponentSets = isTeam1 ? match.sets_equipo2 : match.sets_equipo1;
          sa += teamSets || 0;
          sc += opponentSets || 0;
          if (teamSets > opponentSets) pg++;
        });

        return { teamId: t.id, pg, ds: sa - sc };
      });

      teamStats.sort((a, b) => b.ds - a.ds || b.pg - a.pg);
      const posicion = teamStats.findIndex(s => s.teamId === team.id) + 1;

      return {
        tournamentId: tournament.id,
        nombre: tournament.nombre,
        fecha: tournament.fecha_inicio,
        estado: tournament.estado,
        equipoNombre: team.nombre,
        compañeros: team.jugadores_ids?.filter(id => id !== selectedPlayer.id)
          .map(id => players.find(p => p.id === id)?.nombre)
          .filter(Boolean) || [],
        partidosJugados,
        partidosGanados,
        partidosPerdidos: partidosJugados - partidosGanados,
        setsAFavor,
        setsEnContra,
        puntosAFavor,
        puntosEnContra,
        winRate: partidosJugados > 0 ? (partidosGanados / partidosJugados) * 100 : 0,
        faseAlcanzada,
        esCampeon,
        posicion,
        totalEquipos: tournamentTeams.length
      };
    }).filter(Boolean).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [selectedPlayer, teams, tournaments, matches, players]);

  const isInComparison = (playerId) => comparisonPlayerIds.includes(playerId);

  const StatRow = ({ label, values, highlight = false, suffix = "" }) => (
    <div className={`grid grid-cols-${values.length + 1} gap-2 py-2 ${highlight ? 'bg-slate-50 rounded' : ''}`}>
      <span className="text-xs text-slate-600 font-medium">{label}</span>
      {values.map((val, idx) => (
        <span key={idx} className="text-xs font-bold text-slate-900 text-center">
          {val}{suffix}
        </span>
      ))}
    </div>
  );

  if (!selectedPlayerId) {
    return (
      <Card className="border border-slate-200 h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <Users className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 text-center">
            Selecciona un jugador para ver sus estadísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 h-full flex flex-col bg-white">
      <CardHeader className="bg-white border-b border-slate-100 py-2 md:py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 ml-12 md:ml-0">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            Estadísticas
          </CardTitle>
          <button
            type="button"
            className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 active:bg-slate-100 touch-manipulation"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="pt-4 space-y-4">
          {/* Selected Player Header */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">{selectedPlayer?.nombre}</h3>
                <Badge className={`text-[10px] ${selectedPlayer?.genero === "femenino" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"}`}>
                  {selectedPlayer?.genero === "femenino" ? "F" : "M"}
                </Badge>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= (selectedPlayer?.calificacion || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            {comparisonPlayerIds.length < 3 && !isInComparison(selectedPlayerId) && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => onToggleComparison(selectedPlayerId)}
              >
                + Agregar a comparación
              </Button>
            )}
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-amber-50/70 rounded-lg text-center border border-amber-100">
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{selectedStats?.campeonatos || 0}</p>
              <p className="text-xs text-slate-500">Campeonatos</p>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-lg text-center border border-blue-100">
              <Award className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{selectedStats?.torneosParticipados || 0}</p>
              <p className="text-xs text-slate-500">Torneos</p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="space-y-1 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Partidos Jugados</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.partidosJugados || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Partidos Ganados</span>
              <span className="text-xs font-bold text-green-600">{selectedStats?.partidosGanados || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Partidos Perdidos</span>
              <span className="text-xs font-bold text-red-500">{selectedStats?.partidosPerdidos || 0}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-green-50/70 px-2 rounded border border-green-100">
              <span className="text-xs text-slate-500">Win Rate</span>
              <Badge className="bg-green-500 text-white text-xs">
                {(selectedStats?.winRate || 0).toFixed(0)}%
              </Badge>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Sets a Favor</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.setsAFavor || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Sets en Contra</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.setsEnContra || 0}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-slate-50 px-2 rounded border border-slate-100">
              <span className="text-xs text-slate-500">Diferencia Sets</span>
              <span className={`text-xs font-bold ${(selectedStats?.diferenciaSets || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {(selectedStats?.diferenciaSets || 0) > 0 ? '+' : ''}{selectedStats?.diferenciaSets || 0}
              </span>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Puntos a Favor</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.puntosAFavor || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Puntos en Contra</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.puntosEnContra || 0}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-slate-50 px-2 rounded border border-slate-100">
              <span className="text-xs text-slate-500">Diferencia Puntos</span>
              <span className={`text-xs font-bold ${(selectedStats?.diferenciaPuntos || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {(selectedStats?.diferenciaPuntos || 0) > 0 ? '+' : ''}{selectedStats?.diferenciaPuntos || 0}
              </span>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Prom. Puntos/Partido</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.promedioPuntosPorPartido || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-slate-500">Prom. Sets/Partido</span>
              <span className="text-xs font-bold text-slate-800">{selectedStats?.promedioSetsPorPartido || 0}</span>
            </div>
          </div>

          {/* Comparison Section */}
          {comparisonPlayers.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Comparación ({comparisonPlayers.length}/3)
              </h4>
              
              <div className="space-y-2 mb-3">
                {comparisonPlayers.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-slate-700">{player.nombre}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => onToggleComparison(player.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-lg border border-slate-200 p-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 text-slate-600">Estadística</th>
                      <th className="text-center py-1 font-bold text-slate-900">{selectedPlayer?.nombre?.split(' ')[0]}</th>
                      {comparisonPlayers.map(p => (
                        <th key={p.id} className="text-center py-1 font-bold text-slate-700">
                          {p.nombre?.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1 text-slate-600">Campeonatos</td>
                      <td className="text-center font-bold">{selectedStats?.campeonatos}</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold">{p.stats?.campeonatos}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 text-slate-600">Torneos</td>
                      <td className="text-center font-bold">{selectedStats?.torneosParticipados}</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold">{p.stats?.torneosParticipados}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 text-slate-600">Partidos</td>
                      <td className="text-center font-bold">{selectedStats?.partidosJugados}</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold">{p.stats?.partidosJugados}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 text-slate-600">Ganados</td>
                      <td className="text-center font-bold text-green-700">{selectedStats?.partidosGanados}</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold text-green-700">{p.stats?.partidosGanados}</td>
                      ))}
                    </tr>
                    <tr className="border-b bg-green-50">
                      <td className="py-1 text-slate-600">Win Rate</td>
                      <td className="text-center font-bold">{(selectedStats?.winRate || 0).toFixed(0)}%</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold">{(p.stats?.winRate || 0).toFixed(0)}%</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 text-slate-600">Dif. Sets</td>
                      <td className="text-center font-bold">{selectedStats?.diferenciaSets}</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold">{p.stats?.diferenciaSets}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600">Dif. Puntos</td>
                      <td className="text-center font-bold">{selectedStats?.diferenciaPuntos}</td>
                      {comparisonPlayers.map(p => (
                        <td key={p.id} className="text-center font-bold">{p.stats?.diferenciaPuntos}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tournament History */}
          {playerTournamentHistory.length > 0 && (
            <div className="border-t border-slate-100 pt-4 mt-4">
              <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Historial de Torneos ({playerTournamentHistory.length})
              </h4>
              
              <div className="space-y-3">
                {playerTournamentHistory.map((torneo, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${torneo.esCampeon ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'}`}
                  >
                    {/* Tournament Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 text-xs truncate">{torneo.nombre}</h5>
                        <p className="text-[10px] text-slate-400">
                          {format(new Date(torneo.fecha), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <Badge className={`text-[10px] ${
                        torneo.esCampeon ? 'bg-amber-500 text-white' :
                        torneo.faseAlcanzada === 'Final' ? 'bg-purple-50 text-purple-700' :
                        torneo.faseAlcanzada === 'Semifinal' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {torneo.faseAlcanzada}
                      </Badge>
                    </div>

                    {/* Team Info */}
                    <div className="mb-2 p-2 bg-slate-50/70 rounded text-[10px] border border-slate-100">
                      <p className="text-slate-600 mb-1">
                        <span className="font-medium">Equipo:</span> {torneo.equipoNombre}
                      </p>
                      {torneo.compañeros.length > 0 && (
                        <p className="text-slate-400">
                          <span className="font-medium">Compañeros:</span> {torneo.compañeros.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                        <p className="text-sm font-bold text-slate-800">{torneo.partidosGanados}/{torneo.partidosJugados}</p>
                        <p className="text-[9px] text-slate-400">Partidos</p>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                        <p className="text-sm font-bold text-slate-800">{torneo.setsAFavor}-{torneo.setsEnContra}</p>
                        <p className="text-[9px] text-slate-400">Sets</p>
                      </div>
                      <div className="p-1.5 bg-green-50/70 rounded border border-green-100">
                        <p className="text-sm font-bold text-green-600">{torneo.winRate.toFixed(0)}%</p>
                        <p className="text-[9px] text-slate-400">Win Rate</p>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Posición Final:</span>
                      <span className="font-bold text-slate-700">
                        {torneo.posicion}° de {torneo.totalEquipos}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}