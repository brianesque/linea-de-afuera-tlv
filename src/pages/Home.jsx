import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trophy, Calendar, Users, Waves } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list('-created_date'),
    initialData: [],
  });

  const isAdmin = user?.role === 'admin';
  const enCurso = tournaments.filter(t => t.estado === 'en_curso' || t.estado === 'equipos_armados');
  const finalizados = tournaments.filter(t => t.estado === 'finalizado');

  const getEstadoBadge = (estado) => {
    const estados = {
      configuracion: { label: 'Configuración', class: 'bg-yellow-100 text-yellow-800' },
      equipos_armados: { label: 'Equipos Armados', class: 'bg-blue-100 text-blue-800' },
      en_curso: { label: 'En Curso', class: 'bg-green-100 text-green-800' },
      finalizado: { label: 'Finalizado', class: 'bg-gray-100 text-gray-800' }
    };
    return estados[estado] || estados.configuracion;
  };

  const TournamentCard = ({ tournament }) => {
    const estadoBadge = getEstadoBadge(tournament.estado);
    return (
      <Link to={createPageUrl(`TournamentDetail?id=${tournament.id}`)}>
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-2 border-orange-100 hover:border-orange-300">
          <CardHeader className="bg-gradient-to-br from-sky-100 to-orange-100 border-b border-orange-200">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">
                {tournament.nombre}
              </CardTitle>
              <Trophy className="w-6 h-6 text-orange-500" />
            </div>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${estadoBadge.class}`}>
                {estadoBadge.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>
                  {format(new Date(tournament.fecha_inicio), "d 'de' MMMM, yyyy • HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="w-4 h-4 text-orange-600" />
                <span>
                  {tournament.jugadores_por_equipo} jugadores por equipo
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Formato: {tournament.formato === 'todos_contra_todos' ? 'Todos contra todos' : 'Grupos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-orange-500 p-8 md:p-12 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200')] opacity-10 bg-cover bg-center" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Waves className="w-10 h-10 text-white" />
              <Trophy className="w-12 h-12 text-yellow-300" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Línea De Afuera - TLV
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              {isAdmin ? "Organiza torneos de beach vóley con equipos equilibrados por IA" : "Consulta torneos y estadísticas de beach vóley"}
            </p>
            {isAdmin && (
              <Link to={createPageUrl("CreateTournament")}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-orange-50 font-semibold shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Nuevo Torneo
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Torneos en Curso */}
        {enCurso.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Torneos en Curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enCurso.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        )}

        {/* Torneos Finalizados */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Torneos Pasados</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-gray-200" />
                <CardContent className="h-24 bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : finalizados.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Trophy className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay torneos finalizados todavía
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Los torneos completados aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalizados.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}