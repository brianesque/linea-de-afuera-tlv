import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Calendar, Trophy, DollarSign, Play, User, Settings, Trash2, TrendingUp, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DeleteTournamentDialog from "@/components/home/DeleteTournamentDialog";
import TeamsGrid from "../components/results/TeamsGrid";
import MatchSchedule from "../components/results/MatchSchedule";
import StandingsTable from "../components/results/StandingsTable";
import FinishTournamentDialog from "../components/results/FinishTournamentDialog";
import PlayoffDialog from "../components/results/PlayoffDialog";
import TournamentChat from "../components/tournament/TournamentChat";
import TournamentComments from "../components/tournament/TournamentComments";
import PlayerStatsPanel from "../components/players/PlayerStatsPanel";
import PlayerListSidebar from "../components/players/PlayerListSidebar";

export default function TournamentDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');
  const [user, setUser] = useState(null);
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

  // State for player stats panel - must be before any conditional returns
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState([]);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const tournaments = await base44.entities.Tournament.list();
      return tournaments.find(t => t.id === tournamentId);
    },
    enabled: !!tournamentId,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => base44.entities.Team.filter({ tournament_id: tournamentId }, 'numero'),
    initialData: [],
    enabled: !!tournamentId,
  });

  const { data: matches } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: () => base44.entities.Match.filter({ tournament_id: tournamentId }, 'numero_partido'),
    initialData: [],
    enabled: !!tournamentId,
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    initialData: [],
  });

  const { data: allTeams } = useQuery({
    queryKey: ['all-teams'],
    queryFn: () => base44.entities.Team.list(),
    initialData: [],
  });

  const { data: allMatches } = useQuery({
    queryKey: ['all-matches'],
    queryFn: () => base44.entities.Match.list(),
    initialData: [],
  });

  const { data: allTournaments } = useQuery({
    queryKey: ['all-tournaments'],
    queryFn: () => base44.entities.Tournament.list(),
    initialData: [],
  });

  const updateTournamentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tournament.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success("Configuración actualizada");
    },
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentIdToDelete) => {
      const matchesToDelete = await base44.entities.Match.filter({ tournament_id: tournamentIdToDelete });
      for (const match of matchesToDelete) {
        await base44.entities.Match.delete(match.id);
      }
      
      const teamsToDelete = await base44.entities.Team.filter({ tournament_id: tournamentIdToDelete });
      for (const team of teamsToDelete) {
        await base44.entities.Team.delete(team.id);
      }
      
      await base44.entities.Tournament.delete(tournamentIdToDelete);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success("Torneo eliminado completamente");
      navigate(createPageUrl("Home"));
    },
  });



  const handleTogglePlayoff = (field, value) => {
    updateTournamentMutation.mutate({
      id: tournament.id,
      data: { 
        [field]: value,
        ...(field === 'jugar_final' && !value ? { jugar_semifinal: false } : {})
      }
    });
  };

  const winnerTeam = useMemo(() => {
    if (tournament?.estado !== 'finalizado' || teams.length === 0 || matches.length === 0) {
      return null;
    }

    const finalMatch = matches.find(m => m.fase === 'final' && m.estado === 'finalizado');
    if (finalMatch) {
      const winnerId = finalMatch.sets_equipo1 > finalMatch.sets_equipo2 ? 
        finalMatch.equipo1_id : finalMatch.equipo2_id;
      return teams.find(t => t.id === winnerId);
    }

    const stats = teams.map(team => {
      const teamMatches = matches.filter(m => 
        (m.equipo1_id === team.id || m.equipo2_id === team.id) && 
        m.estado === 'finalizado' &&
        m.fase === 'fase_grupos'
      );

      let partidosGanados = 0;
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
        }
      });

      return {
        team,
        partidosGanados,
        setsAFavor,
        diferenciaSets: setsAFavor - setsEnContra,
        puntosAFavor,
        diferenciaPuntos: puntosAFavor - puntosEnContra
      };
    });

    stats.sort((a, b) => {
      if (tournament.criterio_ganador === 'sets') {
        if (b.diferenciaSets !== a.diferenciaSets) return b.diferenciaSets - a.diferenciaSets;
      } else {
        if (b.partidosGanados !== a.partidosGanados) return b.partidosGanados - a.partidosGanados;
      }

      if (tournament.criterio_empate === 'diferencia_puntos') {
        if (b.diferenciaPuntos !== a.diferenciaPuntos) return b.diferenciaPuntos - a.diferenciaPuntos;
      } else {
        if (b.puntosAFavor !== a.puntosAFavor) return b.puntosAFavor - a.puntosAFavor;
      }

      return b.diferenciaSets - a.diferenciaSets;
    });

    return stats[0]?.team;
  }, [tournament, teams, matches]);

  const winnerPlayerIds = useMemo(() => {
    if (!winnerTeam) return [];
    return winnerTeam.jugadores_ids || [];
  }, [winnerTeam]);

  const canStartPlayoff = useMemo(() => {
    if (!tournament || tournament.estado === 'finalizado') return false;
    if (!tournament.jugar_final && !tournament.jugar_semifinal) return false;
    if (tournament.fase_actual !== 'fase_grupos') return false;
    
    const groupMatches = matches.filter(m => m.fase === 'fase_grupos');
    return groupMatches.every(m => m.estado === 'finalizado');
  }, [tournament, matches]);

  if (!tournamentId) {
    navigate(createPageUrl("Home"));
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Torneo no encontrado</h2>
            <Button onClick={() => navigate(createPageUrl("Home"))}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const participantes = allPlayers.filter(p => 
    tournament.jugadores_seleccionados?.includes(p.id)
  );

  const showChat = tournament.estado === 'en_curso' || tournament.estado === 'equipos_armados' || tournament.estado === 'configuracion';
  const showComments = tournament.estado === 'finalizado';

  const sidebarFilteredPlayers = useMemo(() => {
    if (!sidebarSearchTerm) return participantes;
    return participantes.filter(p => 
      p.nombre.toLowerCase().includes(sidebarSearchTerm.toLowerCase())
    );
  }, [participantes, sidebarSearchTerm]);

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

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
              className="border-2 border-slate-300 hover:bg-slate-50 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-3xl font-bold text-slate-900 truncate">{tournament.nombre}</h1>
              <p className="text-xs text-slate-600">Detalles del torneo</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <DeleteTournamentDialog
                tournamentName={tournament.nombre}
                onDelete={() => deleteTournamentMutation.mutate(tournament.id)}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteTournamentMutation.isPending}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {deleteTournamentMutation.isPending ? "..." : "Eliminar"}
                </Button>
              </DeleteTournamentDialog>
              {tournament.estado === 'configuracion' && (
                <Button
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-800 text-xs"
                  onClick={() => navigate(createPageUrl(`OrganizeTeams?id=${tournament.id}`))}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Organizar
                </Button>
              )}
              {canStartPlayoff && (
                <PlayoffDialog 
                  tournament={tournament}
                  matches={matches}
                  teams={teams}
                />
              )}
              {(tournament.estado === 'en_curso' || tournament.estado === 'equipos_armados') && !canStartPlayoff && (
                <FinishTournamentDialog 
                  tournament={tournament} 
                  matches={matches}
                  onFinish={() => navigate(createPageUrl("Home"))}
                />
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-white border border-slate-200 h-auto">
            <TabsTrigger 
              value="info" 
              className="text-xs py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:font-bold"
            >
              Info
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="text-xs py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:font-bold"
            >
              Participantes
            </TabsTrigger>
            {(tournament.estado === 'equipos_armados' || tournament.estado === 'en_curso' || tournament.estado === 'finalizado') && (
              <>
                <TabsTrigger 
                  value="standings" 
                  className="text-xs py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:font-bold"
                >
                  Posiciones
                </TabsTrigger>
                <TabsTrigger 
                  value="teams" 
                  className="text-xs py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:font-bold"
                >
                  Equipos
                </TabsTrigger>
                <TabsTrigger 
                  value="fixture" 
                  className="text-xs py-2 col-span-2 sm:col-span-1 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:font-bold"
                >
                  Fixture
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-4">
              {tournament.estado === 'finalizado' && winnerTeam && (
                <Card className="mb-4 border-2 border-yellow-300 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardContent className="pt-4 md:pt-6">
                    <div className="text-center">
                      <Trophy className="w-12 h-12 md:w-20 md:h-20 text-yellow-500 mx-auto mb-2 md:mb-4" />
                      <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">¡Campeón!</h2>
                      <p className="text-lg md:text-2xl font-bold text-yellow-700">{winnerTeam.nombre}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
                <Card className="lg:col-span-2 border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <Trophy className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                      Información
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 md:pt-6">
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Fecha y Hora</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                          <p className="font-semibold text-slate-900 text-sm">
                            {format(new Date(tournament.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 ml-6">
                          {format(new Date(tournament.fecha_inicio), "HH:mm", { locale: es })} hs
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-1">Jugadores/Equipo</p>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-600 shrink-0" />
                          <p className="font-semibold text-slate-900 text-sm">
                            {tournament.jugadores_por_equipo} jugadores
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Formato</p>
                          <p className="font-semibold text-slate-900 text-xs">
                            {tournament.formato === 'todos_contra_todos' ? 'Todos vs Todos' : 'Grupos'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Duración</p>
                          <p className="font-semibold text-slate-900 text-xs">
                            {tournament.duracion_partido_minutos} min
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Puntos/Set</p>
                          <p className="font-semibold text-slate-900 text-xs">
                            {tournament.puntos_por_set || 15}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Ganador</p>
                          <p className="font-semibold text-slate-900 text-xs">
                            {tournament.criterio_ganador === 'sets' ? 'Por Sets' : 'Por Partidos'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isAdmin && tournament.estado !== 'finalizado' && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <h3 className="font-semibold text-slate-900 text-xs mb-2">Fase Final</h3>
                        
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex-1 min-w-0 mr-2">
                            <Label className="font-semibold cursor-pointer text-xs block">Final</Label>
                            <p className="text-xs text-slate-600">Mejores 2</p>
                          </div>
                          <Switch
                            checked={tournament.jugar_final || false}
                            onCheckedChange={(checked) => handleTogglePlayoff('jugar_final', checked)}
                            disabled={tournament.fase_actual !== 'fase_grupos'}
                            className="data-[state=checked]:bg-slate-700 shrink-0"
                          />
                        </div>

                        {tournament.jugar_final && (
                          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-1 min-w-0 mr-2">
                              <Label className="font-semibold cursor-pointer text-xs block">Semifinales</Label>
                              <p className="text-xs text-slate-600">Mejores 4</p>
                            </div>
                            <Switch
                              checked={tournament.jugar_semifinal || false}
                              onCheckedChange={(checked) => handleTogglePlayoff('jugar_semifinal', checked)}
                              disabled={tournament.fase_actual !== 'fase_grupos'}
                              className="data-[state=checked]:bg-slate-700 shrink-0"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                      Logística
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Cervezas/persona</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900">{tournament.cervezas_por_persona}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Bebidas/persona</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900">{tournament.bebidas_por_persona}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Snacks</p>
                      <p className="text-base md:text-xl font-semibold text-slate-900">
                        {tournament.snacks ? '✅ Sí' : '❌ No'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500">Presupuesto</p>
                      <p className="text-2xl md:text-3xl font-bold text-slate-900">₪{tournament.costo_total}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="pt-4 md:pt-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-2">Estado</p>
                    <div className="inline-block px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
                      <p className="text-sm md:text-base font-bold text-slate-800">
                        {tournament.estado === 'configuracion' && '⚙️ Config.'}
                        {tournament.estado === 'equipos_armados' && '✅ Armados'}
                        {tournament.estado === 'en_curso' && `🏐 ${tournament.fase_actual === 'fase_grupos' ? 'Grupos' : tournament.fase_actual === 'semifinal' ? 'Semis' : 'Final'}`}
                        {tournament.estado === 'finalizado' && '🏆 Fin'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chat o Comentarios */}
              {showChat && <TournamentChat tournamentId={tournamentId} user={user} />}
              {showComments && <TournamentComments tournamentId={tournamentId} user={user} />}
            </div>
          </TabsContent>

          <TabsContent value="participants">
            <Card className="border-2 border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Participantes ({participantes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {participantes.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay participantes seleccionados todavía</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {participantes.map((player) => {
                      const isChampion = winnerPlayerIds.includes(player.id);
                      return (
                        <Card 
                          key={player.id} 
                          className={`border cursor-pointer hover:shadow-md transition-shadow ${isChampion ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : 'border-purple-200'}`}
                          onClick={() => setSelectedPlayerId(player.id)}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">{player.nombre}</p>
                                  {isChampion && <Trophy className="w-5 h-5 text-yellow-500" />}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {player.genero === "femenino" ? "Femenino" : "Masculino"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-slate-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlayerId(player.id);
                                }}
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Stats
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Panel Overlay */}
            {selectedPlayerId && (
              <div className="fixed inset-0 z-50 flex">
                <div 
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setComparisonPlayerIds([]);
                  }}
                />
                
                <div className="relative flex h-full w-full max-w-4xl ml-auto">
                  <div className="w-64 h-full bg-white shadow-xl">
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
                  
                  <div className="flex-1 h-full bg-white shadow-xl overflow-hidden">
                    <PlayerStatsPanel
                      players={allPlayers}
                      selectedPlayerId={selectedPlayerId}
                      comparisonPlayerIds={comparisonPlayerIds}
                      onSelectPlayer={setSelectedPlayerId}
                      onToggleComparison={handleToggleComparison}
                      onClose={() => {
                        setSelectedPlayerId(null);
                        setComparisonPlayerIds([]);
                      }}
                      tournaments={allTournaments}
                      teams={allTeams}
                      matches={allMatches}
                      isAdmin={isAdmin}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {(tournament.estado === 'equipos_armados' || tournament.estado === 'en_curso' || tournament.estado === 'finalizado') && (
            <>
              <TabsContent value="standings">
                <StandingsTable 
                  teams={teams}
                  matches={matches}
                  tournament={tournament}
                />
              </TabsContent>

              <TabsContent value="teams">
                <TeamsGrid 
                  teams={teams} 
                  allPlayers={allPlayers} 
                  tournament={tournament}
                  tournamentId={tournamentId}
                  winnerTeamId={winnerTeam?.id}
                />
              </TabsContent>

              <TabsContent value="fixture">
                <MatchSchedule 
                  matches={matches} 
                  teams={teams} 
                  tournament={tournament}
                  isAdmin={isAdmin}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}