
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Calendar, Trophy, DollarSign, Play, User, Settings } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import TeamsGrid from "../components/results/TeamsGrid";
import MatchSchedule from "../components/results/MatchSchedule";
import StandingsTable from "../components/results/StandingsTable";
import FinishTournamentDialog from "../components/results/FinishTournamentDialog";
import PlayoffDialog from "../components/results/PlayoffDialog";

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

  const updateTournamentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tournament.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success("Configuración actualizada");
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

    // Si hay final, el ganador es el que ganó la final
    const finalMatch = matches.find(m => m.fase === 'final' && m.estado === 'finalizado');
    if (finalMatch) {
      const winnerId = finalMatch.sets_equipo1 > finalMatch.sets_equipo2 ? 
        finalMatch.equipo1_id : finalMatch.equipo2_id;
      return teams.find(t => t.id === winnerId);
    }

    // Si no hay final, usar el ranking de fase de grupos
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="border-2 border-orange-200 hover:bg-orange-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{tournament.nombre}</h1>
            <p className="text-gray-600">Detalles y configuración del torneo</p>
          </div>
          {tournament.estado === 'configuracion' && isAdmin && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={() => navigate(createPageUrl(`OrganizeTeams?id=${tournament.id}`))}
            >
              <Play className="w-5 h-5 mr-2" />
              Organizar Equipos
            </Button>
          )}
          {canStartPlayoff && isAdmin && (
            <PlayoffDialog 
              tournament={tournament}
              matches={matches}
              teams={teams}
            />
          )}
          {(tournament.estado === 'en_curso' || tournament.estado === 'equipos_armados') && isAdmin && !canStartPlayoff && (
            <FinishTournamentDialog 
              tournament={tournament} 
              matches={matches}
              onFinish={() => navigate(createPageUrl("Home"))}
            />
          )}
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border-2 border-sky-100 p-1">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            {(tournament.estado === 'equipos_armados' || tournament.estado === 'en_curso' || tournament.estado === 'finalizado') && (
              <>
                <TabsTrigger value="standings">Posiciones</TabsTrigger>
                <TabsTrigger value="teams">Equipos</TabsTrigger>
                <TabsTrigger value="fixture">Fixture</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="info">
            {tournament.estado === 'finalizado' && winnerTeam && (
              <Card className="mb-6 border-4 border-yellow-300 shadow-2xl bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Campeón del Torneo!</h2>
                    <p className="text-2xl font-bold text-yellow-700">{winnerTeam.nombre}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-2 border-sky-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-sky-600" />
                    Información del Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-sky-600" />
                        <p className="font-semibold text-gray-900">
                          {format(new Date(tournament.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 ml-7">
                        {format(new Date(tournament.fecha_inicio), "HH:mm", { locale: es })} hs
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Jugadores por Equipo</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        <p className="font-semibold text-gray-900">
                          {tournament.jugadores_por_equipo} jugadores
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Formato</p>
                      <p className="font-semibold text-gray-900">
                        {tournament.formato === 'todos_contra_todos' ? 'Todos contra Todos' : 'Grupos'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Duración por Partido</p>
                      <p className="font-semibold text-gray-900">
                        {tournament.duracion_partido_minutos} minutos
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Puntos por Set</p>
                      <p className="font-semibold text-gray-900">
                        {tournament.puntos_por_set || 15} puntos
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Criterio para Ganador</p>
                      <p className="font-semibold text-gray-900">
                        {tournament.criterio_ganador === 'sets' ? 'Por Sets (Diferencia)' : 'Por Partidos Ganados'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">En Caso de Empate</p>
                      <p className="font-semibold text-gray-900">
                        {tournament.criterio_empate === 'diferencia_puntos' ? 'Diferencia de Puntos' : 'Puntos a Favor'}
                      </p>
                    </div>
                  </div>

                  {isAdmin && tournament.estado !== 'finalizado' && (
                    <div className="mt-6 pt-6 border-t space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">Configuración de Fase Final</h3>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <div>
                          <Label className="font-semibold cursor-pointer">Jugar Final</Label>
                          <p className="text-sm text-gray-600">Los mejores 2 equipos</p>
                        </div>
                        <Switch
                          checked={tournament.jugar_final || false}
                          onCheckedChange={(checked) => handleTogglePlayoff('jugar_final', checked)}
                          disabled={tournament.fase_actual !== 'fase_grupos'}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      {tournament.jugar_final && (
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                          <div>
                            <Label className="font-semibold cursor-pointer">Incluir Semifinales</Label>
                            <p className="text-sm text-gray-600">Los mejores 4 equipos</p>
                          </div>
                          <Switch
                            checked={tournament.jugar_semifinal || false}
                            onCheckedChange={(checked) => handleTogglePlayoff('jugar_semifinal', checked)}
                            disabled={tournament.fase_actual !== 'fase_grupos'}
                            className="data-[state=checked]:bg-purple-600"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Logística
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Cervezas por Persona</p>
                    <p className="text-2xl font-bold text-gray-900">{tournament.cervezas_por_persona}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bebidas por Persona</p>
                    <p className="text-2xl font-bold text-gray-900">{tournament.bebidas_por_persona}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Snacks</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {tournament.snacks ? '✅ Incluidos' : '❌ No incluidos'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-green-200">
                    <p className="text-sm text-gray-500">Presupuesto Total</p>
                    <p className="text-3xl font-bold text-green-600">₪{tournament.costo_total}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-2 border-orange-100 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Estado Actual</p>
                  <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-orange-300">
                    <p className="text-xl font-bold text-orange-800">
                      {tournament.estado === 'configuracion' && '⚙️ En Configuración'}
                      {tournament.estado === 'equipos_armados' && '✅ Equipos Armados'}
                      {tournament.estado === 'en_curso' && `🏐 ${tournament.fase_actual === 'fase_grupos' ? 'Fase de Grupos' : tournament.fase_actual === 'semifinal' ? 'Semifinales' : 'Final'}`}
                      {tournament.estado === 'finalizado' && '🏆 Finalizado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                        <Card key={player.id} className={`border ${isChampion ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : 'border-purple-200'}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">{player.nombre}</p>
                                  {isChampion && <Trophy className="w-5 h-5 text-yellow-500" />}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {player.genero === "femenino" ? "Femenino" : "Masculino"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
