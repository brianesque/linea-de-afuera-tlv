import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, X, Crown, User, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MobileTeamOrganizer({
  teams,
  unassignedPlayers,
  onTeamsChange,
  onUnassignedChange,
  playersData,
  playersPerTeam
}) {
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState(null);

  const getPlayerById = (playerId) => {
    return playersData.find(p => p.id === playerId);
  };

  const calculateTeamAverage = (playerIds) => {
    if (playerIds.length === 0) return 0;
    const calificaciones = playerIds.map(id => {
      const player = playersData.find(p => p.id === id);
      return player ? player.calificacion : 0;
    });
    const sum = calificaciones.reduce((a, b) => a + b, 0);
    return (sum / calificaciones.length).toFixed(2);
  };

  const handleAddPlayer = (teamId, playerId) => {
    // Remove from unassigned
    const newUnassigned = unassignedPlayers.filter(id => id !== playerId);
    onUnassignedChange(newUnassigned);

    // Add to team
    const newTeams = teams.map(team => {
      if (team.id === teamId) {
        return { ...team, jugadores_ids: [...team.jugadores_ids, playerId] };
      }
      return team;
    });
    onTeamsChange(newTeams);
    setSelectedTeamForAdd(null);
  };

  const handleRemovePlayer = (teamId, playerId) => {
    // Remove from team
    const newTeams = teams.map(team => {
      if (team.id === teamId) {
        return { 
          ...team, 
          jugadores_ids: team.jugadores_ids.filter(id => id !== playerId) 
        };
      }
      return team;
    });
    onTeamsChange(newTeams);

    // Add to unassigned
    onUnassignedChange([...unassignedPlayers, playerId]);
  };

  return (
    <div className="flex flex-col h-full pb-4">
      {/* Unassigned Count Indicator */}
      <div className="mb-2 flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Sin Asignar: {unassignedPlayers.length}</span>
        </div>
        {unassignedPlayers.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                Pendientes
            </Badge>
        )}
      </div>

      {/* Teams Grid - 2x2 Layout focus */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-20">
        {teams.map((team) => {
          const promedio = calculateTeamAverage(team.jugadores_ids);
          const isComplete = team.jugadores_ids.length === playersPerTeam;
          const captainName = getPlayerById(team.capitan_id)?.nombre || "Sin Capitán";

          return (
            <Card 
              key={team.id} 
              className={`flex flex-col border ${isComplete ? 'border-green-500 bg-green-50/10' : 'border-gray-300'} shadow-sm overflow-hidden h-[220px]`}
            >
              <div className={`p-2 border-b ${isComplete ? 'bg-green-100/50' : 'bg-gray-50'}`}>
                <h3 className="font-bold text-xs truncate text-gray-900 leading-tight mb-1" title={team.nombre}>
                    {team.nombre}
                </h3>
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] text-gray-600 truncate max-w-[60px]">{captainName}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 h-4 bg-white">
                        ★ {promedio}
                    </Badge>
                </div>
              </div>
              
              <div className="flex-1 p-1 overflow-y-auto bg-white/50">
                <div className="space-y-1">
                  {team.jugadores_ids.map((playerId) => {
                    const player = getPlayerById(playerId);
                    if (!player) return null;
                    const isCaptain = playerId === team.capitan_id;

                    return (
                      <div key={playerId} className="flex items-center justify-between bg-white border border-gray-100 rounded px-1.5 py-1 shadow-sm">
                         <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                                {isCaptain && <Crown className="w-2 h-2 text-amber-500 flex-shrink-0" />}
                                <span className={`text-[10px] font-medium truncate ${isCaptain ? 'text-amber-900' : 'text-gray-800'}`}>
                                    {player.nombre}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`text-[9px] px-1 rounded ${player.genero === 'femenino' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {player.genero === 'femenino' ? 'F' : 'M'}
                                </span>
                                <div className="flex -space-x-0.5">
                                    {[...Array(player.calificacion)].map((_, i) => (
                                    <Star key={i} className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                            </div>
                         </div>
                         {!isCaptain && (
                            <button 
                                onClick={() => handleRemovePlayer(team.id, playerId)}
                                className="text-gray-400 hover:text-red-500 p-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                         )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Player Button / Slot */}
              {!isComplete && (
                 <Dialog>
                    <DialogTrigger asChild>
                        <button 
                            className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-medium border-t border-sky-100 flex items-center justify-center gap-1 transition-colors"
                            onClick={() => setSelectedTeamForAdd(team.id)}
                        >
                            <Plus className="w-3 h-3" /> Agregar Jugador
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-lg max-h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="text-base">
                                Agregar a {team.nombre}
                            </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-1 p-2">
                            {unassignedPlayers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No hay jugadores disponibles
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {unassignedPlayers.map(pid => {
                                        const p = getPlayerById(pid);
                                        return (
                                            <button
                                                key={pid}
                                                onClick={() => handleAddPlayer(team.id, pid)}
                                                className="flex flex-col items-start p-2 rounded border border-gray-200 bg-white hover:bg-sky-50 hover:border-sky-200 active:bg-sky-100 text-left transition-all"
                                            >
                                                <span className="font-medium text-sm text-gray-900 truncate w-full">{p.nombre}</span>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                                        {p.genero === 'femenino' ? 'F' : 'M'}
                                                    </Badge>
                                                    <div className="flex">
                                                        {[...Array(p.calificacion)].map((_, i) => (
                                                            <Star key={i} className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </DialogContent>
                 </Dialog>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}