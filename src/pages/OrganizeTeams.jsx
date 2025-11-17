import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PlayerSelector from "../components/organize/PlayerSelector";
import CaptainSelector from "../components/organize/CaptainSelector";
import OrganizationMethodSelector from "../components/organize/OrganizationMethodSelector";
import ManualTeamOrganizer from "../components/organize/ManualTeamOrganizer";

export default function OrganizeTeams() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  const [step, setStep] = useState(1);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [organizationMethod, setOrganizationMethod] = useState(null);
  const [teams, setTeams] = useState([]);
  const [unassignedPlayers, setUnassignedPlayers] = useState([]);
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

  const handleContinueToStep3 = () => {
    setStep(3);
  };

  const handleSelectMethod = async (method) => {
    setOrganizationMethod(method);
    
    if (method === 'manual') {
      // Inicializar equipos vacíos con solo capitanes
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

      const initialTeams = captains.map((captainId, index) => {
        const animal = animales[index] || { animal: "Guerreros", origen: "TLV" };
        return {
          id: `team-${index}`,
          nombre: `Equipo ${index + 1} - ${animal.animal} de ${animal.origen}`,
          numero: index + 1,
          capitan_id: captainId,
          jugadores_ids: [captainId]
        };
      });

      setTeams(initialTeams);
      setUnassignedPlayers(selectedPlayerIds.filter(id => !captains.includes(id)));
      setStep(4);
    } else {
      // Organizar con IA
      await handleOrganizeWithAI();
    }
  };

  const handleOrganizeWithAI = async () => {
    setIsOrganizing(true);

    const playersData = selectedPlayers.map(p => ({
      id: p.id,
      nombre: p.nombre,
      calificacion: p.calificacion,
      genero: p.genero,
      is_captain: captains.includes(p.id)
    }));

    const mujeres = playersData.filter(p => p.genero === 'femenino');
    const hombres = playersData.filter(p => p.genero === 'masculino');
    const minWomenPerTeam = Math.floor(mujeres.length / numTeams);
    const canGuaranteeWomen = minWomenPerTeam >= 1;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un asistente que organiza equipos de beach vóley de manera equilibrada.

Datos:
- Número de equipos: ${numTeams}
- Jugadores por equipo: ${tournament.jugadores_por_equipo}
- Jugadores disponibles: ${JSON.stringify(playersData)}
- Mujeres disponibles: ${mujeres.length}
- Hombres disponibles: ${hombres.length}

Instrucciones CRÍTICAS (en orden de prioridad):
1. Los jugadores marcados como "is_captain: true" DEBEN ser capitanes y estar en equipos DIFERENTES.
2. ${canGuaranteeWomen ?
  `Distribuye las MUJERES de manera EQUITATIVA: cada equipo debe tener AL MENOS 1 mujer. Si hay mujeres extra, distribúyelas equitativamente.` :
  `Distribuye las MUJERES de manera EQUITATIVA en los equipos (el mismo número por equipo, o diferencia máxima de 1).`}
3. Al evaluar niveles de equipos, considera que un hombre nivel 4 es equivalente a una mujer nivel 5 (los hombres tienen ventaja física). Por lo tanto, al balancear equipos ajusta: calificacion_efectiva = genero === "masculino" ? calificacion + 0.5 : calificacion.
4. Equilibra los equipos por calificación efectiva para que el promedio de cada equipo sea lo más similar posible.
5. Cada equipo debe tener exactamente ${tournament.jugadores_por_equipo} jugadores.

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

    const organizedTeams = result.equipos.map((equipo, index) => {
      const animal = animales[index] || { animal: "Guerreros", origen: "TLV" };
      return {
        id: `team-${index}`,
        nombre: `Equipo ${equipo.numero} - ${animal.animal} de ${animal.origen}`,
        numero: equipo.numero,
        capitan_id: equipo.capitan_id,
        jugadores_ids: equipo.jugadores_ids
      };
    });

    setTeams(organizedTeams);
    setUnassignedPlayers([]);
    setIsOrganizing(false);
    setStep(5); // Paso de revisión después de AI
  };

  const handleConfirmTeams = async () => {
    setIsOrganizing(true);

    // Borrar equipos existentes si los hay
    const existingTeams = await base44.entities.Team.filter({ tournament_id: tournamentId });
    for (const team of existingTeams) {
      await base44.entities.Team.delete(team.id);
    }

    // Borrar partidos existentes si los hay
    const existingMatches = await base44.entities.Match.filter({ tournament_id: tournamentId });
    for (const match of existingMatches) {
      await base44.entities.Match.delete(match.id);
    }

    const playersData = selectedPlayers.map(p => ({
      id: p.id,
      calificacion: p.calificacion
    }));

    const teamsToCreate = teams.map(team => {
      const jugadoresCalificaciones = team.jugadores_ids.map(id => {
        const player = playersData.find(p => p.id === id);
        return player ? player.calificacion : 3;
      });
      const promedio = jugadoresCalificaciones.reduce((a, b) => a + b, 0) / jugadoresCalificaciones.length;

      return {
        tournament_id: tournamentId,
        nombre: team.nombre,
        numero: team.numero,
        capitan_id: team.capitan_id,
        jugadores_ids: team.jugadores_ids,
        promedio_calificacion: parseFloat(promedio.toFixed(2))
      };
    });

    await base44.entities.Team.bulkCreate(teamsToCreate);

    const createdTeams = await base44.entities.Team.filter({ tournament_id: tournamentId });
    const matches = [];
    const startTime = new Date(tournament.fecha_inicio);

    if (tournament.formato === 'todos_contra_todos') {
      const allMatches = [];
      for (let i = 0; i < createdTeams.length; i++) {
        for (let j = i + 1; j < createdTeams.length; j++) {
          allMatches.push({
            team1: createdTeams[i],
            team2: createdTeams[j]
          });
        }
      }

      const orderedMatches = [];
      const teamLastPlayed = new Map();

      while (allMatches.length > 0) {
        let bestMatchIndex = -1;
        let bestScore = -1;

        for (let i = 0; i < allMatches.length; i++) {
          const match = allMatches[i];
          const team1LastPlayed = teamLastPlayed.get(match.team1.id) || -Infinity;
          const team2LastPlayed = teamLastPlayed.get(match.team2.id) || -Infinity;

          const minGapSinceLastPlayed = Math.min(
            orderedMatches.length - team1LastPlayed,
            orderedMatches.length - team2LastPlayed
          );

          if (minGapSinceLastPlayed > bestScore) {
            bestScore = minGapSinceLastPlayed;
            bestMatchIndex = i;
          }
        }

        if (bestMatchIndex >= 0) {
          const selectedMatch = allMatches.splice(bestMatchIndex, 1)[0];
          orderedMatches.push(selectedMatch);
          teamLastPlayed.set(selectedMatch.team1.id, orderedMatches.length - 1);
          teamLastPlayed.set(selectedMatch.team2.id, orderedMatches.length - 1);
        } else {
          if (allMatches.length > 0) {
            const selectedMatch = allMatches.splice(0, 1)[0];
            orderedMatches.push(selectedMatch);
            teamLastPlayed.set(selectedMatch.team1.id, orderedMatches.length - 1);
            teamLastPlayed.set(selectedMatch.team2.id, orderedMatches.length - 1);
          }
        }
      }

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

  const handleBackFromReview = () => {
    // Permitir reorganizar manualmente
    setUnassignedPlayers([]);
    setStep(4);
  };

  const stepTitles = {
    1: 'Selecciona los jugadores que participarán',
    2: 'Elige los capitanes de cada equipo',
    3: '¿Cómo deseas organizar los equipos?',
    4: 'Arrastra jugadores para formar los equipos',
    5: 'Revisa los equipos organizados por IA'
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
            <p className="text-gray-600">{stepTitles[step]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-sky-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-sky-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-sky-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 4 ? 'bg-sky-500' : 'bg-gray-200'}`} />
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium">
            <span className={step >= 1 ? 'text-sky-600' : 'text-gray-400'}>Jugadores</span>
            <span className={step >= 2 ? 'text-sky-600' : 'text-gray-400'}>Capitanes</span>
            <span className={step >= 3 ? 'text-sky-600' : 'text-gray-400'}>Método</span>
            <span className={step >= 4 ? 'text-sky-600' : 'text-gray-400'}>Organizar</span>
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
            onOrganize={handleContinueToStep3}
            isOrganizing={false}
          />
        )}

        {step === 3 && (
          <OrganizationMethodSelector onSelectMethod={handleSelectMethod} />
        )}

        {step === 4 && (
          <ManualTeamOrganizer
            teams={teams}
            unassignedPlayers={unassignedPlayers}
            onTeamsChange={setTeams}
            onUnassignedChange={setUnassignedPlayers}
            onBack={() => setStep(3)}
            onConfirm={handleConfirmTeams}
            isConfirming={isOrganizing}
            playersData={selectedPlayers}
            playersPerTeam={tournament.jugadores_por_equipo}
          />
        )}

        {step === 5 && (
          <div className="space-y-4">
            <ManualTeamOrganizer
              teams={teams}
              unassignedPlayers={unassignedPlayers}
              onTeamsChange={setTeams}
              onUnassignedChange={setUnassignedPlayers}
              onBack={handleBackFromReview}
              onConfirm={handleConfirmTeams}
              isConfirming={isOrganizing}
              playersData={selectedPlayers}
              playersPerTeam={tournament.jugadores_por_equipo}
            />
          </div>
        )}
      </div>
    </div>
  );
}