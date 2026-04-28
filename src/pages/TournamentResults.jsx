import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Calendar, ShoppingCart, Play } from "lucide-react";
import TeamsGrid from "../components/results/TeamsGrid";
import MatchSchedule from "../components/results/MatchSchedule";
import ShoppingList from "../components/results/ShoppingList";
import StartTournamentDialog from "../components/results/StartTournamentDialog";
import TournamentPDFExport from "../components/results/TournamentPDFExport";

export default function TournamentResults() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  const { data: tournament, isLoading: loadingTournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const tournaments = await base44.entities.Tournament.list();
      return tournaments.find(t => t.id === tournamentId);
    },
    enabled: !!tournamentId,
  });

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => base44.entities.Team.filter({ tournament_id: tournamentId }, 'numero'),
    initialData: [],
    enabled: !!tournamentId,
  });

  const { data: matches, isLoading: loadingMatches } = useQuery({
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

  if (!tournamentId) {
    navigate(createPageUrl("Home"));
    return null;
  }

  const isLoading = loadingTournament || loadingTeams || loadingMatches;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  const totalParticipants = tournament?.jugadores_seleccionados?.length || 0;
  const numTeams = teams.length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl(`TournamentDetail?id=${tournamentId}`))}
              className="border-2 border-orange-200 hover:bg-orange-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tournament?.nombre}</h1>
              <p className="text-gray-600">Equipos, fixture y lista de compras</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TournamentPDFExport
              tournament={tournament}
              teams={teams}
              matches={matches}
              allPlayers={allPlayers}
            />
            {tournament?.estado === 'equipos_armados' && (
              <StartTournamentDialog
                tournament={tournament}
                tournamentId={tournamentId}
              />
            )}
          </div>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-sky-100 p-1">
            <TabsTrigger 
              value="teams"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Equipos
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Fixture
            </TabsTrigger>
            <TabsTrigger 
              value="shopping"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Lista de Compras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsGrid 
              teams={teams} 
              allPlayers={allPlayers} 
              tournament={tournament}
              tournamentId={tournamentId}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <MatchSchedule 
              matches={matches} 
              teams={teams} 
              tournament={tournament}
            />
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingList 
              tournament={tournament} 
              totalParticipants={totalParticipants}
              numTeams={numTeams}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}