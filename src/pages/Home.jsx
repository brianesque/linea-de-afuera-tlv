import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trophy, Calendar, Users, Waves, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteTournamentDialog from "@/components/home/DeleteTournamentDialog";
import ReleaseNotesDialog from "@/components/home/ReleaseNotesDialog";
import { format, isAfter, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [formatoFilter, setFormatoFilter] = useState("todos");
  const [mesFilter, setMesFilter] = useState("todos");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentIdToDelete) => {
      const matchesToDelete = await base44.entities.Match.filter({ tournament_id: tournamentIdToDelete });
      for (const match of matchesToDelete) {
        await base44.entities.Match.delete(match.id);
      }
      
      const teamsToDelete = await base44.entities.Team.filter({ tournament_id: tournamentIdToDelete });
      for (const team of teamsToDelete) {
        await base44.entities.Team.delete(team.id);
      }
      
      await base44.entities.Tournament.delete(tournamentIdToDelete);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success("Torneo eliminado");
    },
  });



  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      // Búsqueda por nombre
      if (searchTerm && !tournament.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por estado
      if (estadoFilter !== "todos" && tournament.estado !== estadoFilter) {
        return false;
      }

      // Filtro por formato
      if (formatoFilter !== "todos" && tournament.formato !== formatoFilter) {
        return false;
      }

      // Filtro por mes
      if (mesFilter !== "todos") {
        const tournamentDate = new Date(tournament.fecha_inicio);
        const targetMonth = parseInt(mesFilter);
        if (tournamentDate.getMonth() !== targetMonth) {
          return false;
        }
      }

      return true;
    });
  }, [tournaments, searchTerm, estadoFilter, formatoFilter, mesFilter]);

  const enCurso = filteredTournaments.filter(t => t.estado === 'en_curso' || t.estado === 'equipos_armados');
  const finalizados = filteredTournaments.filter(t => t.estado === 'finalizado');

  const getEstadoBadge = (estado) => {
    const estados = {
      configuracion: { label: 'Configuración', class: 'bg-amber-50 text-amber-700' },
      equipos_armados: { label: 'Equipos Armados', class: 'bg-blue-50 text-blue-700' },
      en_curso: { label: 'En Curso', class: 'bg-green-50 text-green-700' },
      finalizado: { label: 'Finalizado', class: 'bg-slate-100 text-slate-600' }
    };
    return estados[estado] || estados.configuracion;
  };

  const TournamentCard = ({ tournament }) => {
    const estadoBadge = getEstadoBadge(tournament.estado);
    return (
      <div 
        onClick={() => navigate(createPageUrl(`TournamentDetail?id=${tournament.id}`))} 
        className="block relative group cursor-pointer h-full"
      >
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 h-full shadow-sm bg-white border-slate-200 hover:border-slate-300">
                <CardHeader className="pb-3 relative bg-white border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base md:text-lg font-bold pr-8 text-slate-800">
                      {tournament.nombre}
                    </CardTitle>
                    <Trophy className="w-5 h-5 text-slate-400" />
                  </div>
            <div className="mt-2">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge.class}`}>
                {estadoBadge.label}
              </span>
            </div>

            {isAdmin && (
                <div 
                  className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shadow-sm bg-white hover:bg-slate-50 border-slate-200"
                    onClick={() => navigate(createPageUrl(`TournamentDetail?id=${tournament.id}`))}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <DeleteTournamentDialog 
                    tournamentName={tournament.nombre}
                    onDelete={() => deleteTournamentMutation.mutate(tournament.id)}
                  />
                </div>
              )}
          </CardHeader>
          <CardContent className="pt-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">
                    {format(new Date(tournament.fecha_inicio), "d 'de' MMMM, yyyy • HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {tournament.jugadores_por_equipo} jugadores por equipo
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    {tournament.formato === 'todos_contra_todos' ? 'Todos contra todos' : 'Grupos'}
                  </p>
                </div>
              </div>
            </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-3 md:p-6 bg-slate-50">
      <ReleaseNotesDialog />
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-8 md:p-14 mb-4 shadow-lg min-h-[180px] md:min-h-[280px]">
          {/* Mobile background */}
          <div className="absolute inset-0 bg-[url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919dd394bc675994c843030/925008ae7_5aa6b193-594f-4006-9d72-843f1a7cc4a5.png')] opacity-30 bg-cover bg-[center_top_30%] md:hidden" />
          {/* Desktop background */}
          <div className="hidden md:block absolute inset-0 bg-[url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919dd394bc675994c843030/f2c0f66f7_Screenshot2025-11-24at233015.png')] opacity-40 bg-cover bg-center" />
          <div className="relative z-10">
            <h1 className="text-lg md:text-2xl font-bold text-white mb-1">
              Línea De Afuera - TLV
            </h1>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6">
            <Link to={createPageUrl("CreateTournament")}>
              <Button size="lg" className="font-semibold shadow-md text-sm bg-slate-700 text-white hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Torneo
              </Button>
            </Link>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6 shadow-sm bg-white border-slate-200">
          <CardHeader className="py-3 bg-white border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base text-slate-700">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
              Buscar y Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="configuracion">Configuración</SelectItem>
                  <SelectItem value="equipos_armados">Equipos Armados</SelectItem>
                  <SelectItem value="en_curso">En Curso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={formatoFilter} onValueChange={setFormatoFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los formatos</SelectItem>
                  <SelectItem value="todos_contra_todos">Todos vs Todos</SelectItem>
                  <SelectItem value="grupos">Grupos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mesFilter} onValueChange={setMesFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los meses</SelectItem>
                  <SelectItem value="0">Enero</SelectItem>
                  <SelectItem value="1">Febrero</SelectItem>
                  <SelectItem value="2">Marzo</SelectItem>
                  <SelectItem value="3">Abril</SelectItem>
                  <SelectItem value="4">Mayo</SelectItem>
                  <SelectItem value="5">Junio</SelectItem>
                  <SelectItem value="6">Julio</SelectItem>
                  <SelectItem value="7">Agosto</SelectItem>
                  <SelectItem value="8">Septiembre</SelectItem>
                  <SelectItem value="9">Octubre</SelectItem>
                  <SelectItem value="10">Noviembre</SelectItem>
                  <SelectItem value="11">Diciembre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || estadoFilter !== "todos" || formatoFilter !== "todos" || mesFilter !== "todos") && (
              <div className="mt-3 flex items-center gap-2">
                <p className="text-xs text-slate-600">
                  Mostrando {filteredTournaments.length} de {tournaments.length} torneos
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setEstadoFilter("todos");
                    setFormatoFilter("todos");
                    setMesFilter("todos");
                  }}
                  className="text-xs"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {enCurso.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-slate-800">Torneos en Curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {enCurso.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-bold mb-3 text-slate-800">Torneos Pasados</h2>
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
                {(searchTerm || estadoFilter !== "todos" || formatoFilter !== "todos" || mesFilter !== "todos")
                  ? "Prueba ajustando los filtros"
                  : "Los torneos completados aparecerán aquí"}
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