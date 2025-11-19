import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Crown, Star, Users, TrendingUp, Check, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MobileTeamOrganizer from "./MobileTeamOrganizer";

export default function ManualTeamOrganizer({ 
  teams, 
  unassignedPlayers, 
  onTeamsChange, 
  onUnassignedChange,
  onBack,
  onConfirm,
  isConfirming,
  playersData,
  playersPerTeam
}) {
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [collapsedTeams, setCollapsedTeams] = useState({});
  const [teamNames, setTeamNames] = useState(() => {
    const names = {};
    teams.forEach(team => {
      names[team.id] = team.nombre;
    });
    return names;
  });

  const calculateTeamAverage = (playerIds) => {
    if (playerIds.length === 0) return 0;
    const calificaciones = playerIds.map(id => {
      const player = playersData.find(p => p.id === id);
      return player ? player.calificacion : 0;
    });
    const sum = calificaciones.reduce((a, b) => a + b, 0);
    return (sum / calificaciones.length).toFixed(2);
  };

  const getPlayerById = (playerId) => {
    return playersData.find(p => p.id === playerId);
  };

  const toggleTeamCollapse = (teamId) => {
    setCollapsedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const playerId = draggableId;
    
    // No permitir mover capitanes
    const sourceTeam = teams.find(t => t.id === source.droppableId);
    if (sourceTeam && sourceTeam.capitan_id === playerId) {
      return;
    }

    // Remover del origen
    if (source.droppableId === 'unassigned') {
      const newUnassigned = Array.from(unassignedPlayers);
      newUnassigned.splice(source.index, 1);
      onUnassignedChange(newUnassigned);
    } else {
      const newTeams = teams.map(team => {
        if (team.id === source.droppableId) {
          const newPlayerIds = Array.from(team.jugadores_ids);
          newPlayerIds.splice(source.index, 1);
          return { ...team, jugadores_ids: newPlayerIds };
        }
        return team;
      });
      onTeamsChange(newTeams);
    }

    // Pequeño delay para evitar conflictos de estado
    setTimeout(() => {
      // Agregar al destino
      if (destination.droppableId === 'unassigned') {
        onUnassignedChange(prev => {
          const newUnassigned = Array.from(prev);
          newUnassigned.splice(destination.index, 0, playerId);
          return newUnassigned;
        });
      } else {
        onTeamsChange(prev => {
          return prev.map(team => {
            if (team.id === destination.droppableId) {
              const newPlayerIds = Array.from(team.jugadores_ids);
              newPlayerIds.splice(destination.index, 0, playerId);
              return { ...team, jugadores_ids: newPlayerIds };
            }
            return team;
          });
        });
      }
    }, 0);
  };

  const handleTeamNameChange = (teamId, newName) => {
    setTeamNames(prev => ({ ...prev, [teamId]: newName }));
  };

  const handleSaveTeamName = (teamId) => {
    const newTeams = teams.map(team => {
      if (team.id === teamId) {
        return { ...team, nombre: teamNames[teamId] };
      }
      return team;
    });
    onTeamsChange(newTeams);
    setEditingTeamId(null);
  };

  const allPlayersAssigned = unassignedPlayers.length === 0;
  
  // Verificar que todos los equipos tengan la cantidad correcta de jugadores
  const allTeamsComplete = teams.every(team => team.jugadores_ids.length === playersPerTeam);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-sky-100">
        <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
          <CardTitle>Organiza los Equipos</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-600 mb-4">
            Arrastra jugadores entre equipos o devuélvelos a la lista sin asignar. Los capitanes no se pueden mover.
          </p>
          {!allPlayersAssigned && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Quedan {unassignedPlayers.length} jugador(es) sin asignar
              </p>
            </div>
          )}
          {allPlayersAssigned && !allTeamsComplete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ⚠️ Todos los equipos deben tener exactamente {playersPerTeam} jugadores
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="block lg:hidden h-[calc(100vh-280px)]">
        <MobileTeamOrganizer
          teams={teams}
          unassignedPlayers={unassignedPlayers}
          onTeamsChange={onTeamsChange}
          onUnassignedChange={onUnassignedChange}
          playersData={playersData}
          playersPerTeam={playersPerTeam}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-200px)] overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Left Column - Unassigned - 30% */}
          <div className="w-[30%] h-full overflow-y-auto pb-20">
            <Card className="border-2 border-gray-300 h-full flex flex-col">
              <CardHeader className="bg-gray-100 sticky top-0 z-10 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5" />
                    Sin Asignar ({unassignedPlayers.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 overflow-y-auto">
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] space-y-2 ${snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg p-2' : ''}`}
                    >
                      {unassignedPlayers.map((playerId, index) => {
                        const player = getPlayerById(playerId);
                        if (!player) return null;
                        
                        return (
                          <Draggable key={playerId} draggableId={playerId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-xl ring-2 ring-sky-500' : ''}`}
                              >
                                <div>
                                  <span className="font-semibold text-sm block">{player.nombre}</span>
                                  <div className="flex gap-0.5 mt-1">
                                    {[...Array(player.calificacion)].map((_, i) => (
                                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </div>
                                </div>
                                <Badge className={player.genero === "femenino" ? "bg-pink-100 text-pink-800 text-xs" : "bg-blue-100 text-blue-800 text-xs"}>
                                  {player.genero === "femenino" ? "F" : "M"}
                                </Badge>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Teams - 70% */}
          <div className="w-[70%] h-full overflow-y-auto pb-20 px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const promedio = calculateTeamAverage(team.jugadores_ids);
                const isComplete = team.jugadores_ids.length === playersPerTeam;
                const captain = getPlayerById(team.capitan_id);
                const captainName = captain ? captain.nombre : "Sin Capitán";
                
                return (
                  <Card 
                    key={team.id} 
                    className={`border-2 transition-all duration-300 ${
                      isComplete 
                        ? "border-green-500 bg-green-50/30" 
                        : "border-orange-200 bg-white"
                    }`}
                  >
                    <Droppable droppableId={team.id}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          <CardHeader 
                            className={`cursor-pointer transition-colors ${
                              isComplete 
                                ? 'bg-green-100/50' 
                                : 'bg-gray-50'
                            } ${snapshot.isDraggingOver ? 'bg-sky-100' : ''}`}
                            onClick={() => toggleTeamCollapse(team.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {editingTeamId === team.id ? (
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Input
                                      value={teamNames[team.id]}
                                      onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                                      className="text-sm bg-white"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveTeamName(team.id)}
                                      className="bg-green-500 hover:bg-green-600"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-gray-800">{team.nombre}</CardTitle>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTeamId(team.id);
                                      }}
                                    >
                                      <Pencil className="w-3 h-3 text-gray-500" />
                                    </Button>
                                  </div>
                                )}
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                  <Badge variant="outline" className="bg-white text-xs border-gray-300">
                                    <TrendingUp className="w-3 h-3 mr-1 text-gray-500" />
                                    Prom: {promedio}
                                  </Badge>
                                  <Badge 
                                    className={`text-xs border ${
                                      isComplete 
                                        ? "bg-green-500 text-white border-green-600" 
                                        : "bg-orange-100 text-orange-700 border-orange-200"
                                    }`}
                                  >
                                    {team.jugadores_ids.length} Jugadores
                                  </Badge>
                                  <Badge variant="outline" className="bg-white text-xs border-gray-300 text-amber-700">
                                    <Crown className="w-3 h-3 mr-1 text-amber-500" />
                                    Cap: {captainName}
                                  </Badge>
                                </div>
                              </div>
                              {collapsedTeams[team.id] ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
                            </div>
                          </CardHeader>
                          {!collapsedTeams[team.id] && (
                            <CardContent className="pt-3">
                              <div className="space-y-2">
                                {team.jugadores_ids.map((playerId, index) => {
                                  const player = getPlayerById(playerId);
                                  if (!player) return null;
                                  
                                  const isCaptain = playerId === team.capitan_id;

                                  return (
                                    <Draggable 
                                      key={playerId} 
                                      draggableId={playerId} 
                                      index={index}
                                      isDragDisabled={isCaptain}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-2 rounded border flex items-center justify-between ${
                                            isCaptain 
                                              ? 'bg-amber-50 border-amber-200 cursor-not-allowed' 
                                              : `bg-white border-gray-200 hover:border-sky-300 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-sky-500 z-50' : ''}`
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            {isCaptain && <Crown className="w-3 h-3 text-amber-500" />}
                                            <span className={`font-medium text-xs ${isCaptain ? 'text-amber-900' : 'text-gray-700'}`}>
                                              {player.nombre}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className={`text-[10px] px-1 h-5 ${player.genero === "femenino" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"}`}>
                                              {player.genero === "femenino" ? "F" : "M"}
                                            </Badge>
                                            <div className="flex -space-x-0.5">
                                              {[...Array(player.calificacion)].map((_, i) => (
                                                <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                              </div>
                            </CardContent>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </Card>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      </div>

      <div className="flex justify-between">
        <Button
          size="lg"
          variant="outline"
          onClick={onBack}
          disabled={isConfirming}
        >
          Atrás
        </Button>
        <Button
          size="lg"
          onClick={onConfirm}
          disabled={!allPlayersAssigned || !allTeamsComplete || isConfirming}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          {isConfirming ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Finalizando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Confirmar Equipos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}