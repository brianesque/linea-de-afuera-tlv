import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, TrendingUp } from "lucide-react";

export default function TeamsGrid({ teams, allPlayers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {teams.map((team) => {
        const teamPlayers = team.jugadores_ids
          .map(id => allPlayers.find(p => p.id === id))
          .filter(Boolean);

        return (
          <Card key={team.id} className="border-2 border-sky-100 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-br from-sky-100 to-blue-100 border-b-2 border-sky-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    {team.nombre}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-sky-500 text-white">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Promedio: {team.promedio_calificacion}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {teamPlayers.map((player) => {
                  const isCaptain = player.id === team.capitan_id;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        isCaptain
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCaptain && <Crown className="w-5 h-5 text-amber-600" />}
                        <span className={`font-semibold ${isCaptain ? 'text-amber-900' : 'text-gray-900'}`}>
                          {player.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(player.calificacion)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}