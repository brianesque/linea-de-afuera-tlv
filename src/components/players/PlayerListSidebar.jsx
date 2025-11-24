import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, Users, Check } from "lucide-react";

export default function PlayerListSidebar({
  players,
  selectedPlayerId,
  comparisonPlayerIds,
  onSelectPlayer,
  onToggleComparison,
  searchTerm,
  onSearchChange,
  isAdmin = false
}) {
  const isSelected = (playerId) => playerId === selectedPlayerId;
  const isInComparison = (playerId) => comparisonPlayerIds.includes(playerId);

  return (
    <Card className="border border-slate-200 h-full flex flex-col">
      <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          Jugadores ({players.length})
        </CardTitle>
      </CardHeader>
      
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-sm h-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {players.map((player) => (
            <div
              key={player.id}
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                isSelected(player.id)
                  ? 'bg-slate-700 text-white'
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => onSelectPlayer(player.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isSelected(player.id) ? 'text-white' : 'text-slate-900'}`}>
                    {player.nombre}
                  </p>
                  <Badge 
                    className={`text-[10px] px-1 py-0 shrink-0 ${
                      player.genero === "femenino" 
                        ? isSelected(player.id) ? "bg-pink-200 text-pink-900" : "bg-pink-100 text-pink-800"
                        : isSelected(player.id) ? "bg-blue-200 text-blue-900" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {player.genero === "femenino" ? "F" : "M"}
                  </Badge>
                  {isAdmin && (
                    <div className="flex items-center shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-2.5 h-2.5 ${
                            star <= player.calificacion
                              ? "fill-yellow-400 text-yellow-400"
                              : isSelected(player.id) ? "text-slate-500" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {isInComparison(player.id) && (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}