import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Users, Star, AlertCircle, LayoutGrid, List, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [viewMode, setViewMode] = React.useState("grid");
  const requiredPlayers = numTeams * playersPerTeam;
  const canContinue = selectedPlayerIds.length >= requiredPlayers;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-sky-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Seleccionar Jugadores
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none h-12 w-12"
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none h-12 w-12"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedPlayerIds.length} / {requiredPlayers} jugadores seleccionados
                </p>
                <p className="text-sm text-gray-600">
                  Se formarán {numTeams} equipos de {playersPerTeam} jugadores
                </p>
              </div>
              {!canContinue && (
                <AlertCircle className="w-8 h-8 text-orange-500" />
              )}
            </div>
          </div>

          {!canContinue && (
            <Alert className="mb-6 border-yellow-300 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Necesitas seleccionar al menos {requiredPlayers} jugadores para formar {numTeams} equipos completos.
              </AlertDescription>
            </Alert>
          )}

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {allPlayers.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                return (
                  <Card
                    key={player.id}
                    className={`cursor-pointer transition-all duration-200 relative ${
                      isSelected
                        ? 'border-2 border-sky-500 bg-sky-50'
                        : 'border border-gray-200 hover:border-sky-300'
                    }`}
                    onClick={() => onPlayerToggle(player.id)}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onPlayerToggle(player.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{player.nombre}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= player.calificacion
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-sky-100 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              {allPlayers.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-4 p-4 border-b border-gray-200 cursor-pointer transition-colors relative ${
                      isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onPlayerToggle(player.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onPlayerToggle(player.id)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{player.nombre}</p>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= player.calificacion
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-sky-500" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onContinue}
          disabled={!canContinue}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
        >
          Continuar a Capitanes
        </Button>
      </div>
    </div>
  );
}