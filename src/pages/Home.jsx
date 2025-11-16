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
      configuracion: { label: 'Configuración', class: 'bg-amber-100 text-amber-800' },
      equipos_armados: { label: 'Equipos Armados', class: 'bg-blue-100 text-blue-800' },
      en_curso: { label: 'En Curso', class: 'bg-green-100 text-green-800' },
      finalizado: { label: 'Finalizado', class: 'bg-slate-100 text-slate-800' }
    };
    return estados[estado] || estados.configuracion;
  };

  const TournamentCard = ({ tournament }) => {
    const estadoBadge = getEstadoBadge(tournament.estado);
    return (
      <Link to={createPageUrl(`TournamentDetail?id=${tournament.id}`)}>
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border border-slate-200 hover:border-slate-300">
          <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base md:text-lg font-bold text-slate-900">
                {tournament.nombre}
              </CardTitle>
              <Trophy className="w-5 h-5 text-slate-600" />
            </div>
            <div className="mt-2">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${estadoBadge.class}`}>
                {estadoBadge.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate">
                  {format(new Date(tournament.fecha_inicio), "d 'de' MMMM, yyyy • HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  {tournament.jugadores_por_equipo} jugadores por equipo
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                  {tournament.formato === 'todos_contra_todos' ? 'Todos contra todos' : 'Grupos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 md:p-10 mb-6 shadow-lg">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200')] opacity-10 bg-cover bg-center" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Waves className="w-7 h-7 md:w-8 md:h-8 text-white" />
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              Línea De Afuera - TLV
            </h1>
            <p className="text-sm md:text-lg text-white/90 mb-4 max-w-2xl">
              {isAdmin ? "Organiza torneos de beach vóley" : "Consulta torneos y estadísticas"}
            </p>
            {isAdmin && (
              <Link to={createPageUrl("CreateTournament")}>
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nuevo Torneo
                </Button>
              </Link>
            )}
          </div>
        </div>

        {enCurso.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Torneos en Curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {enCurso.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Torneos Pasados</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-28 bg-slate-100" />
                <CardContent className="h-20 bg-slate-50" />
              </Card>
            ))}
          </div>
        ) : finalizados.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-14 h-14 text-slate-400 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No hay torneos finalizados
              </h3>
              <p className="text-slate-600 text-center text-sm max-w-md">
                Los torneos completados aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {finalizados.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}