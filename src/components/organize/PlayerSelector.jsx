import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Users, Star, AlertCircle } from "lucide-react";
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
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {allPlayers.map((player) => (
              <Card
                key={player.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPlayerIds.includes(player.id)
                    ? 'border-2 border-sky-500 bg-sky-50'
                    : 'border border-gray-200 hover:border-sky-300'
                }`}
                onClick={() => onPlayerToggle(player.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedPlayerIds.includes(player.id)}
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
            ))}
          </div>
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