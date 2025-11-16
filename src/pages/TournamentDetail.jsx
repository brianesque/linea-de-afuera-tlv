import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Calendar, Trophy, DollarSign, Play } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TournamentDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const tournaments = await base44.entities.Tournament.list();
      return tournaments.find(t => t.id === tournamentId);
    },
    enabled: !!tournamentId,
  });

  if (!tournamentId) {
    navigate(createPageUrl("Home"));
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Torneo no encontrado</h2>
            <Button onClick={() => navigate(createPageUrl("Home"))}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="border-2 border-orange-200 hover:bg-orange-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{tournament.nombre}</h1>
            <p className="text-gray-600">Detalles y configuración del torneo</p>
          </div>
          {tournament.estado === 'configuracion' && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={() => navigate(createPageUrl(`OrganizeTeams?id=${tournament.id}`))}
            >
              <Play className="w-5 h-5 mr-2" />
              Organizar Equipos
            </Button>
          )}
          {tournament.estado === 'equipos_armados' && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-sky-500 to-blue-600"
              onClick={() => navigate(createPageUrl(`TournamentResults?id=${tournament.id}`))}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Ver Resultados
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <Card className="lg:col-span-2 border-2 border-sky-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-sky-600" />
                Información del Torneo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sky-600" />
                    <p className="font-semibold text-gray-900">
                      {format(new Date(tournament.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 ml-7">
                    {format(new Date(tournament.fecha_inicio), "HH:mm", { locale: es })} hs
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Jugadores por Equipo</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <p className="font-semibold text-gray-900">
                      {tournament.jugadores_por_equipo} jugadores
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Formato</p>
                  <p className="font-semibold text-gray-900">
                    {tournament.formato === 'todos_contra_todos' ? 'Todos contra Todos' : 'Grupos'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Duración por Partido</p>
                  <p className="font-semibold text-gray-900">
                    {tournament.duracion_partido_minutos} minutos
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Criterio para Ganador</p>
                  <p className="font-semibold text-gray-900">
                    {tournament.criterio_ganador === 'sets' ? 'Por Sets' : 'Por Partidos Ganados'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">En Caso de Empate</p>
                  <p className="font-semibold text-gray-900">
                    {tournament.criterio_empate === 'diferencia_puntos' ? 'Diferencia de Puntos' : 'Puntos a Favor'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logística */}
          <Card className="border-2 border-green-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Logística
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Cervezas por Persona</p>
                <p className="text-2xl font-bold text-gray-900">{tournament.cervezas_por_persona}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bebidas por Persona</p>
                <p className="text-2xl font-bold text-gray-900">{tournament.bebidas_por_persona}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Snacks</p>
                <p className="text-xl font-semibold text-gray-900">
                  {tournament.snacks ? '✅ Incluidos' : '❌ No incluidos'}
                </p>
              </div>
              <div className="pt-4 border-t border-green-200">
                <p className="text-sm text-gray-500">Presupuesto Total</p>
                <p className="text-3xl font-bold text-green-600">₪{tournament.costo_total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado del Torneo */}
        <Card className="mt-6 border-2 border-orange-100 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Estado Actual</p>
              <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-orange-300">
                <p className="text-xl font-bold text-orange-800">
                  {tournament.estado === 'configuracion' && '⚙️ En Configuración'}
                  {tournament.estado === 'equipos_armados' && '✅ Equipos Armados'}
                  {tournament.estado === 'en_curso' && '🏐 En Curso'}
                  {tournament.estado === 'finalizado' && '🏆 Finalizado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}