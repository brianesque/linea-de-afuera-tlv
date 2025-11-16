import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MatchSchedule({ matches, teams, tournament }) {
  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.nombre || "Equipo";
  };

  return (
    <Card className="border-2 border-orange-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-orange-600" />
          Cronograma de Partidos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay partidos programados todavía</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <Card key={match.id} className="border-2 border-sky-100 bg-gradient-to-r from-white to-sky-50">
                <CardContent className="pt-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2 md:w-32">
                      <Badge className="bg-sky-500 text-white font-bold">
                        Partido {match.numero_partido}
                      </Badge>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex-1 text-right">
                          <p className="font-bold text-gray-900 text-lg">
                            {getTeamName(match.equipo1_id).split(' - ')[1] || getTeamName(match.equipo1_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getTeamName(match.equipo1_id).split(' - ')[0]}
                          </p>
                        </div>
                        
                        <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                          <span className="text-white font-bold text-xl">VS</span>
                        </div>
                        
                        <div className="flex-1 text-left">
                          <p className="font-bold text-gray-900 text-lg">
                            {getTeamName(match.equipo2_id).split(' - ')[1] || getTeamName(match.equipo2_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getTeamName(match.equipo2_id).split(' - ')[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:w-48 text-right">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {format(new Date(match.horario_estimado), "HH:mm", { locale: es })} hs
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {matches.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Duración total estimada</p>
                <p className="text-sm text-gray-600">Basado en {tournament?.duracion_partido_minutos} min por partido</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {matches.length * (tournament?.duracion_partido_minutos || 30)} min
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}