import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Users, Star, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Table2 } from "lucide-react";
import { useState } from "react";

export default function PlayerSelector({
  allPlayers,
  selectedPlayerIds,
  onPlayerToggle,
  searchTerm,
  setSearchTerm,
  numTeams,
  playersPerTeam,
  onContinue
}) {
  const [viewMode, setViewMode] = useState("table");

  const totalPlayersNeeded = numTeams * playersPerTeam;
  const hasCorrectAmount = selectedPlayerIds.length === totalPlayersNeeded;
  const difference = selectedPlayerIds.length - totalPlayersNeeded;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-sky-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Seleccionar Jugadores
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar jugadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-none ${viewMode === "grid" ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white" : ""}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("table")}
                className={`rounded-none ${viewMode === "table" ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white" : ""}`}
              >
                <Table2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-sky-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">
                  {selectedPlayerIds.length} de {totalPlayersNeeded} jugadores seleccionados
                </p>
                <p className="text-sm text-gray-600">
                  Necesitas exactamente {totalPlayersNeeded} jugadores ({numTeams} equipos × {playersPerTeam} jugadores)
                </p>
              </div>
            </div>
          </div>

          {!hasCorrectAmount && selectedPlayerIds.length > 0 && (
            <div className={`border-2 rounded-lg p-4 ${
              difference > 0 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  difference > 0 ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <div>
                  <p className={`font-semibold ${
                    difference > 0 ? 'text-yellow-900' : 'text-red-900'
                  }`}>
                    {difference > 0 
                      ? `Tienes ${difference} jugador${difference > 1 ? 'es' : ''} de más` 
                      : `Te faltan ${Math.abs(difference)} jugador${Math.abs(difference) > 1 ? 'es' : ''}`
                    }
                  </p>
                  <p className={`text-sm ${
                    difference > 0 ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {difference > 0 
                      ? 'Deselecciona algunos jugadores para continuar' 
                      : 'Selecciona más jugadores para continuar'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-200">
        <CardContent className="pt-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlayers.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                return (
                  <Card
                    key={player.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-2 border-sky-500 bg-sky-50"
                        : "border-2 border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onPlayerToggle(player.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={isSelected} className="mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {player.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              className={
                                player.genero === "femenino"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {player.genero === "femenino" ? "F" : "M"}
                            </Badge>
                            <div className="flex gap-0.5">
                              {[...Array(player.calificacion)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <Checkbox
                        checked={allPlayers.length > 0 && selectedPlayerIds.length === allPlayers.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            allPlayers.forEach(p => {
                              if (!selectedPlayerIds.includes(p.id)) {
                                onPlayerToggle(p.id);
                              }
                            });
                          } else {
                            allPlayers.forEach(p => {
                              if (selectedPlayerIds.includes(p.id)) {
                                onPlayerToggle(p.id);
                              }
                            });
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Género</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    return (
                      <tr
                        key={player.id}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${
                          isSelected ? "bg-sky-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => onPlayerToggle(player.id)}
                      >
                        <td className="p-3">
                          <Checkbox checked={isSelected} />
                        </td>
                        <td className="p-3 font-medium text-gray-900">
                          {player.nombre}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              player.genero === "femenino"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {player.genero === "femenino" ? "Femenino" : "Masculino"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-0.5">
                            {[...Array(player.calificacion)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onContinue}
          disabled={!hasCorrectAmount}
          className="bg-sky-600 hover:bg-sky-700"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}