
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Search, Sparkles, Crown } from "lucide-react";
import PlayerSelector from "../components/organize/PlayerSelector";
import CaptainSelector from "../components/organize/CaptainSelector";

export default function OrganizeTeams() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  const [step, setStep] = useState(1);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOrganizing, setIsOrganizing] = useState(false);

  const { data: tournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const tournaments = await base44.entities.Tournament.list();
      return tournaments.find(t => t.id === tournamentId);
    },
    enabled: !!tournamentId,
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('nombre'),
    initialData: [],
  });

  const updateTournamentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tournament.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });

  useEffect(() => {
    if (tournament?.jugadores_seleccionados) {
      setSelectedPlayerIds(tournament.jugadores_seleccionados);
    }
  }, [tournament]);

  if (!tournamentId || !tournament) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const selectedPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
  const filteredPlayers = allPlayers.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const numTeams = Math.floor(selectedPlayerIds.length / tournament.jugadores_por_equipo);

  const handlePlayerToggle = (playerId) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleContinueToStep2 = async () => {
    await updateTournamentMutation.mutateAsync({
      id: tournamentId,
      data: { jugadores_seleccionados: selectedPlayerIds }
    });
    setCaptains(Array(numTeams).fill(null));
    setStep(2);
  };

  const handleOrganize = async () => {
    setIsOrganizing(true);

    const playersData = selectedPlayers.map(p => ({
      id: p.id,
      nombre: p.nombre,
      calificacion: p.calificacion,
      genero: p.genero,
      is_captain: captains.includes(p.id)
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un asistente que organiza equipos de beach vóley de manera equilibrada.

Datos:
- Número de equipos: ${numTeams}
- Jugadores por equipo: ${tournament.jugadores_por_equipo}
- Jugadores disponibles: ${JSON.stringify(playersData)}

Instrucciones CRÍTICAS (en orden de prioridad):
1. Los jugadores marcados como "is_captain: true" DEBEN ser capitanes y estar en equipos DIFERENTES.
2. Distribuye las MUJERES de manera EQUITATIVA en todos los equipos (cada equipo debe tener el mismo número de mujeres, o diferencia de máximo 1).
3. Después equilibra por CALIFICACIÓN para que el promedio de cada equipo sea lo más similar posible.
4. Cada equipo debe tener exactamente ${tournament.jugadores_por_equipo} jugadores.

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

    const teams = await base44.entities.Team.filter({ tournament_id: tournamentId });
    const matches = [];
    const startTime = new Date(tournament.fecha_inicio);

    if (tournament.formato === 'todos_contra_todos') {
      // Crear todas las combinaciones de partidos
      const allMatches = [];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          allMatches.push({
            team1: teams[i],
            team2: teams[j]
          });
        }
      }

      // Algoritmo para ordenar partidos evitando que un equipo juegue 2 veces seguidas
      const orderedMatches = [];
      const teamLastPlayed = new Map(); // Stores the index in orderedMatches when a team last played
      
      while (allMatches.length > 0) {
        let bestMatchIndex = -1;
        let bestScore = -1; // Represents the minimum gap since last played for the teams in a match

        // Search for the best match to add next
        for (let i = 0; i < allMatches.length; i++) {
          const match = allMatches[i];
          const team1LastPlayed = teamLastPlayed.get(match.team1.id) || -Infinity;
          const team2LastPlayed = teamLastPlayed.get(match.team2.id) || -Infinity;
          
          // Calculate how many matches ago these teams played
          // A higher value means a longer break
          const minGapSinceLastPlayed = Math.min(
            orderedMatches.length - team1LastPlayed, // Gap for team1
            orderedMatches.length - team2LastPlayed  // Gap for team2
          );

          // Prefer matches where teams haven't played recently (larger gap)
          if (minGapSinceLastPlayed > bestScore) {
            bestScore = minGapSinceLastPlayed;
            bestMatchIndex = i;
          }
        }

        // If a best match is found, add it to the ordered list
        if (bestMatchIndex >= 0) {
          const selectedMatch = allMatches.splice(bestMatchIndex, 1)[0];
          orderedMatches.push(selectedMatch);
          // Update the last played index for the teams
          teamLastPlayed.set(selectedMatch.team1.id, orderedMatches.length - 1);
          teamLastPlayed.set(selectedMatch.team2.id, orderedMatches.length - 1);
        } else {
          // Fallback: If no "best" match can be found (e.g., all teams have played recently),
          // just pick the first available match to prevent an infinite loop.
          // This case should ideally be rare with a good scoring heuristic.
          if (allMatches.length > 0) {
            const selectedMatch = allMatches.splice(0, 1)[0];
            orderedMatches.push(selectedMatch);
            teamLastPlayed.set(selectedMatch.team1.id, orderedMatches.length - 1);
            teamLastPlayed.set(selectedMatch.team2.id, orderedMatches.length - 1);
          }
        }
      }

      // Create the match objects with the optimized order
      orderedMatches.forEach((match, index) => {
        const matchTime = new Date(startTime.getTime() + index * tournament.duracion_partido_minutos * 60000);
        matches.push({
          tournament_id: tournamentId,
          equipo1_id: match.team1.id,
          equipo2_id: match.team2.id,
          numero_partido: index + 1,
          horario_estimado: matchTime.toISOString(),
          estado: 'pendiente'
        });
      });
    }

    if (matches.length > 0) {
      await base44.entities.Match.bulkCreate(matches);
    }

    await updateTournamentMutation.mutateAsync({
      id: tournamentId,
      data: { estado: 'equipos_armados' }
    });

    setIsOrganizing(false);
    navigate(createPageUrl(`TournamentResults?id=${tournamentId}`));
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl(`TournamentDetail?id=${tournamentId}`))}
            className="border-2 border-orange-200 hover:bg-orange-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizar Equipos</h1>
            <p className="text-gray-600">
              {step === 1 ? 'Selecciona los jugadores que participarán' : 'Elige los capitanes de cada equipo'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-sky-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-sky-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-sky-500' : 'bg-gray-200'}`} />
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium">
            <span className={step >= 1 ? 'text-sky-600' : 'text-gray-400'}>Jugadores</span>
            <span className={step >= 2 ? 'text-sky-600' : 'text-gray-400'}>Capitanes</span>
            <span className={step >= 3 ? 'text-sky-600' : 'text-gray-400'}>Organizar</span>
          </div>
        </div>

        {step === 1 && (
          <PlayerSelector
            allPlayers={filteredPlayers}
            selectedPlayerIds={selectedPlayerIds}
            onPlayerToggle={handlePlayerToggle}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            numTeams={numTeams}
            playersPerTeam={tournament.jugadores_por_equipo}
            onContinue={handleContinueToStep2}
          />
        )}

        {step === 2 && (
          <CaptainSelector
            selectedPlayers={selectedPlayers}
            captains={captains}
            setCaptains={setCaptains}
            numTeams={numTeams}
            onBack={() => setStep(1)}
            onOrganize={handleOrganize}
            isOrganizing={isOrganizing}
          />
        )}
      </div>
    </div>
  );
}
