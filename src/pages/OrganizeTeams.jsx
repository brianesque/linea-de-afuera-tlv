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
      is_captain: captains.includes(p.id)
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un asistente que organiza equipos de beach vóley de manera equilibrada.

Datos:
- Número de equipos: ${numTeams}
- Jugadores por equipo: ${tournament.jugadores_por_equipo}
- Jugadores disponibles: ${JSON.stringify(playersData)}

Instrucciones:
1. Crea ${numTeams} equipos equilibrados basándote en las calificaciones (1-5).
2. Los jugadores marcados como "is_captain: true" DEBEN ser capitanes y estar en equipos diferentes.
3. Distribuye el resto de jugadores para que el promedio de calificación de cada equipo sea lo más similar posible.
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
    let matchNumber = 1;
    const startTime = new Date(tournament.fecha_inicio);

    if (tournament.formato === 'todos_contra_todos') {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const matchTime = new Date(startTime.getTime() + (matchNumber - 1) * tournament.duracion_partido_minutos * 60000);
          matches.push({
            tournament_id: tournamentId,
            equipo1_id: teams[i].id,
            equipo2_id: teams[j].id,
            numero_partido: matchNumber,
            horario_estimado: matchTime.toISOString(),
            estado: 'pendiente'
          });
          matchNumber++;
        }
      }
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