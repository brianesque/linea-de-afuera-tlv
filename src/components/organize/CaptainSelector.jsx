import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Star, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CaptainSelector({
  selectedPlayers,
  captains,
  setCaptains,
  numTeams,
  onBack,
  onOrganize,
  isOrganizing
}) {
  const handleCaptainChange = (teamIndex, playerId) => {
    const newCaptains = [...captains];
    newCaptains[teamIndex] = playerId;
    setCaptains(newCaptains);
  };

  const allCaptainsSelected = captains.every(c => c !== null);
  const availablePlayers = (teamIndex) => {
    return selectedPlayers.filter(p => {
      const isAlreadyCaptain = captains.includes(p.id) && captains[teamIndex] !== p.id;
      return !isAlreadyCaptain;
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-600" />
            Elegir Capitanes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6 text-gray-600">
            Selecciona {numTeams} capitanes, uno para cada equipo. Los capitanes serán distribuidos en equipos diferentes.
          </p>

          <div className="space-y-4">
            {Array.from({ length: numTeams }, (_, i) => (
              <Card key={i} className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Crown className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-gray-900">
                        Capitán Equipo {i + 1}
                      </span>
                    </div>
                    <Select
                      value={captains[i] || ""}
                      onValueChange={(value) => handleCaptainChange(i, value)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Seleccionar capitán..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers(i).map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            <div className="flex items-center gap-2">
                              <span>{player.nombre}</span>
                              <div className="flex gap-0.5">
                                {[...Array(player.calificacion)].map((_, idx) => (
                                  <Star key={idx} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          size="lg"
          variant="outline"
          onClick={onBack}
          disabled={isOrganizing}
        >
          Atrás
        </Button>
        <Button
          size="lg"
          onClick={onOrganize}
          disabled={!allCaptainsSelected || isOrganizing}
          className="bg-sky-600 hover:bg-sky-700"
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          Continuar
        </Button>
      </div>
    </div>
  );
}