import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Award, BarChart3, Filter, LayoutGrid, List, ArrowUpDown, Menu, X } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PlayerStatsPanel from "../components/players/PlayerStatsPanel";
import PlayerListSidebar from "../components/players/PlayerListSidebar";

export default function PlayerStats() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [generoFilter, setGeneroFilter] = useState("todos");
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("nombre");
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState([]);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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
      campeonatos,
      winRate: partidosJugados > 0 ? (partidosGanados / partidosJugados) * 100 : 0
    };
  };

  const playersWithStats = useMemo(() => {
    return players.map(player => ({
      ...player,
      stats: getPlayerStats(player)
    }));
  }, [players, tournaments, teams, matches]);

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = playersWithStats.filter(player => {
      if (searchTerm && !player.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (generoFilter !== "todos" && player.genero !== generoFilter) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "nombre":
          return a.nombre.localeCompare(b.nombre);
        case "campeonatos":
          return b.stats.campeonatos - a.stats.campeonatos;
        case "torneos":
          return b.stats.torneosParticipados - a.stats.torneosParticipados;
        case "partidos":
          return b.stats.partidosJugados - a.stats.partidosJugados;
        case "ganados":
          return b.stats.partidosGanados - a.stats.partidosGanados;
        case "winrate":
          return b.stats.winRate - a.stats.winRate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [playersWithStats, searchTerm, generoFilter, sortBy]);

  const sidebarFilteredPlayers = sidebarSearchTerm 
    ? players.filter(p => p.nombre.toLowerCase().includes(sidebarSearchTerm.toLowerCase()))
    : players;

  const handleToggleComparison = (playerId) => {
    setComparisonPlayerIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      }
      if (prev.length >= 3) {
        toast.error("Máximo 3 jugadores para comparar");
        return prev;
      }
      return [...prev, playerId];
    });
  };

  const PlayerCard = ({ player }) => {
    const stats = player.stats;
    return (
      <Card className="border border-slate-200 bg-white hover:shadow-md transition-shadow shadow-sm">
        <CardHeader className="bg-white border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800">
              {player.nombre}
            </CardTitle>
            <Badge className={player.genero === "femenino" ? "bg-pink-50 text-pink-700 text-xs" : "bg-blue-50 text-blue-700 text-xs"}>
              {player.genero === "femenino" ? "F" : "M"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-400">Torneos</p>
                <p className="text-lg font-bold text-slate-800">{stats.torneosParticipados}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-slate-400">Campeonatos</p>
                <p className="text-lg font-bold text-slate-800">{stats.campeonatos}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Partidos Jugados</span>
                <span className="font-semibold text-slate-800 text-sm">{stats.partidosJugados}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Partidos Ganados</span>
                <span className="font-semibold text-green-600 text-sm">{stats.partidosGanados}</span>
              </div>
              {stats.partidosJugados > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Win Rate</span>
                  <Badge className="bg-green-50 text-green-700 text-xs">
                    {stats.winRate.toFixed(0)}%
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Sets</span>
                <span className="font-semibold text-slate-800">
                  {stats.setsAFavor} - {stats.setsEnContra}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Puntos</span>
                <span className="font-semibold text-slate-800">
                  {stats.puntosAFavor} - {stats.puntosEnContra}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-3 md:p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-slate-600" />
            <span>Estadísticas</span>
          </h1>
          <p className="text-sm text-slate-500">
            Rendimiento de jugadores · <span className="text-slate-400">Click en un jugador para ver estadísticas avanzadas</span>
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-4 border border-slate-200 bg-white shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100 py-3">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base text-slate-700">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
              Buscar y Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <Select value={generoFilter} onValueChange={setGeneroFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los géneros</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
                  <SelectItem value="campeonatos">Campeonatos (Mayor)</SelectItem>
                  <SelectItem value="torneos">Torneos (Mayor)</SelectItem>
                  <SelectItem value="partidos">Partidos Jugados (Mayor)</SelectItem>
                  <SelectItem value="ganados">Partidos Ganados (Mayor)</SelectItem>
                  <SelectItem value="winrate">Win Rate (Mayor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(searchTerm || generoFilter !== "todos") && (
                  <>
                    <p className="text-xs text-slate-600">
                      Mostrando {filteredAndSortedPlayers.length} de {players.length} jugadores
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setGeneroFilter("todos");
                      }}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  </>
                )}
              </div>

              <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-none text-xs ${viewMode === "grid" ? "bg-slate-700 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  <LayoutGrid className="w-3 h-3 mr-1" />
                  Grid
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`rounded-none text-xs ${viewMode === "table" ? "bg-slate-700 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  <List className="w-3 h-3 mr-1" />
                  Tabla
                </Button>
              </div>
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
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAndSortedPlayers.map((player) => (
              <div key={player.id} onClick={() => setSelectedPlayerId(player.id)} className="cursor-pointer">
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-200">
                      <TableHead 
                        className="font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                        onClick={() => setSortBy("nombre")}
                      >
                        <div className="flex items-center">
                          Jugador
                          {sortBy === "nombre" && <ArrowUpDown className="w-3 h-3 ml-1" />}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">Género</TableHead>
                      <TableHead 
                        className="font-semibold text-slate-600 text-center cursor-pointer hover:bg-slate-100"
                        onClick={() => setSortBy("campeonatos")}
                      >
                        <div className="flex items-center justify-center">
                          Campeonatos
                          {sortBy === "campeonatos" && <ArrowUpDown className="w-3 h-3 ml-1" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold text-slate-600 text-center cursor-pointer hover:bg-slate-100"
                        onClick={() => setSortBy("torneos")}
                      >
                        <div className="flex items-center justify-center">
                          Torneos
                          {sortBy === "torneos" && <ArrowUpDown className="w-3 h-3 ml-1" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold text-slate-600 text-center cursor-pointer hover:bg-slate-100"
                        onClick={() => setSortBy("partidos")}
                      >
                        <div className="flex items-center justify-center">
                          Partidos
                          {sortBy === "partidos" && <ArrowUpDown className="w-3 h-3 ml-1" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold text-slate-600 text-center cursor-pointer hover:bg-slate-100"
                        onClick={() => setSortBy("ganados")}
                      >
                        <div className="flex items-center justify-center">
                          Ganados
                          {sortBy === "ganados" && <ArrowUpDown className="w-3 h-3 ml-1" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold text-slate-600 text-center cursor-pointer hover:bg-slate-100"
                        onClick={() => setSortBy("winrate")}
                      >
                        <div className="flex items-center justify-center">
                          Win Rate
                          {sortBy === "winrate" && <ArrowUpDown className="w-3 h-3 ml-1" />}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600 text-center">Sets</TableHead>
                      <TableHead className="font-semibold text-slate-600 text-center">Puntos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPlayers.map((player) => {
                      const stats = player.stats;
                      return (
                        <TableRow 
                          key={player.id} 
                          className="hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                          onClick={() => setSelectedPlayerId(player.id)}
                        >
                          <TableCell className="font-semibold text-slate-800">{player.nombre}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${player.genero === "femenino" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"}`}>
                              {player.genero === "femenino" ? "F" : "M"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-50 text-amber-700">{stats.campeonatos}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-slate-700">{stats.torneosParticipados}</TableCell>
                          <TableCell className="text-center font-semibold text-slate-700">{stats.partidosJugados}</TableCell>
                          <TableCell className="text-center font-semibold text-green-600">{stats.partidosGanados}</TableCell>
                          <TableCell className="text-center">
                            {stats.partidosJugados > 0 ? (
                              <Badge className="bg-green-50 text-green-700">
                                {stats.winRate.toFixed(0)}%
                              </Badge>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <span className="font-semibold text-slate-700">{stats.setsAFavor}</span>
                            <span className="text-slate-400"> - </span>
                            <span className="font-semibold text-slate-700">{stats.setsEnContra}</span>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <span className="font-semibold text-slate-700">{stats.puntosAFavor}</span>
                            <span className="text-slate-400"> - </span>
                            <span className="font-semibold text-slate-700">{stats.puntosEnContra}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Panel Overlay */}
        {selectedPlayerId && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setSelectedPlayerId(null);
                setComparisonPlayerIds([]);
                setShowMobileSidebar(false);
              }}
            />
            
            <div className="relative flex h-full w-full max-w-4xl ml-auto">
              {/* Desktop Sidebar - always visible */}
              <div className="hidden md:block w-64 h-full bg-white shadow-xl">
                <PlayerListSidebar
                  players={sidebarFilteredPlayers}
                  selectedPlayerId={selectedPlayerId}
                  comparisonPlayerIds={comparisonPlayerIds}
                  onSelectPlayer={setSelectedPlayerId}
                  onToggleComparison={handleToggleComparison}
                  searchTerm={sidebarSearchTerm}
                  onSearchChange={setSidebarSearchTerm}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Mobile Sidebar - toggle with hamburger */}
              <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-500 active:bg-slate-100 touch-manipulation"
                    onClick={() => setShowMobileSidebar(false)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <PlayerListSidebar
                  players={sidebarFilteredPlayers}
                  selectedPlayerId={selectedPlayerId}
                  comparisonPlayerIds={comparisonPlayerIds}
                  onSelectPlayer={(id) => {
                    setSelectedPlayerId(id);
                    setShowMobileSidebar(false);
                  }}
                  onToggleComparison={handleToggleComparison}
                  searchTerm={sidebarSearchTerm}
                  onSearchChange={setSidebarSearchTerm}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Mobile Sidebar Backdrop */}
              {showMobileSidebar && (
                <div 
                  className="md:hidden fixed inset-0 bg-black/30 z-40"
                  onClick={() => setShowMobileSidebar(false)}
                />
              )}
              
              <div className="flex-1 h-full bg-white shadow-xl overflow-hidden">
                {/* Mobile hamburger button */}
                <div className="md:hidden absolute top-2 left-2 z-30">
                  <button
                    type="button"
                    className="h-11 w-11 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm active:bg-slate-100 touch-manipulation"
                    onClick={() => setShowMobileSidebar(true)}
                  >
                    <Menu className="w-6 h-6 text-slate-600" />
                  </button>
                </div>
                
                <PlayerStatsPanel
                  players={players}
                  selectedPlayerId={selectedPlayerId}
                  comparisonPlayerIds={comparisonPlayerIds}
                  onSelectPlayer={setSelectedPlayerId}
                  onToggleComparison={handleToggleComparison}
                  onClose={() => {
                    setSelectedPlayerId(null);
                    setComparisonPlayerIds([]);
                    setShowMobileSidebar(false);
                  }}
                  tournaments={tournaments}
                  teams={teams}
                  matches={matches}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}