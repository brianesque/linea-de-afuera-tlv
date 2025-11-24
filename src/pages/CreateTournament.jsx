import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function CreateTournament() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nombre: "",
    jugadores_por_equipo: 2,
    numero_equipos: 4,
    fecha_inicio: "",
    formato: "todos_contra_todos",
    criterio_ganador: "sets",
    criterio_empate: "diferencia_puntos",
    duracion_partido_minutos: 30,
    puntos_por_set: 15, // Added new field
    cervezas_por_persona: 2,
    bebidas_por_persona: 2,
    snacks: true,
    jugar_semifinal: false,
    jugar_final: false,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TournamentTemplate.list(),
    initialData: [],
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    initialData: [],
  });

  const createTournamentMutation = useMutation({
    mutationFn: (data) => base44.entities.Tournament.create(data),
    onSuccess: (tournament) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success("¡Torneo creado exitosamente!");
      navigate(createPageUrl(`OrganizeTeams?id=${tournament.id}`));
    },
  });

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        jugadores_por_equipo: template.jugadores_por_equipo,
        formato: template.formato,
        criterio_ganador: template.criterio_ganador || "sets",
        criterio_empate: template.criterio_empate || "diferencia_puntos",
        jugar_semifinal: template.jugar_semifinal || false,
        jugar_final: template.jugar_final || false,
        duracion_partido_minutos: template.duracion_partido_minutos || 30,
        puntos_por_set: template.puntos_por_set || 15, // Apply template value for puntos_por_set
        cervezas_por_persona: template.cervezas_por_persona || 2,
        bebidas_por_persona: template.bebidas_por_persona || 2,
        snacks: template.snacks || false,
        template_id: templateId,
      });
      toast.success("Plantilla aplicada");
    }
  };

  const calculateCost = () => {
    const totalParticipants = formData.jugadores_por_equipo * formData.numero_equipos;
    const beerCost = totalParticipants * formData.cervezas_por_persona * 12;
    const drinksCost = totalParticipants * formData.bebidas_por_persona * 5;
    const snacksCost = formData.snacks ? totalParticipants * 15 : 0;
    return beerCost + drinksCost + snacksCost;
  };

  const totalPlayersNeeded = formData.jugadores_por_equipo * formData.numero_equipos;
  const hasEnoughPlayers = allPlayers.length >= totalPlayersNeeded;
  
  const isMissingRequiredFields = !formData.nombre || !formData.fecha_inicio;
  const canSubmit = !isMissingRequiredFields && hasEnoughPlayers;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.fecha_inicio) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (!hasEnoughPlayers) {
      toast.error(`Necesitas al menos ${totalPlayersNeeded} jugadores. Tienes ${allPlayers.length}.`);
      return;
    }

    const tournamentData = {
      ...formData,
      costo_total: calculateCost(),
      estado: "configuracion",
      fase_actual: "fase_grupos"
    };

    createTournamentMutation.mutate(tournamentData);
  };

  return (
    <div className="min-h-screen p-3 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 md:mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-800">Crear Nuevo Torneo</h1>
            <p className="text-xs md:text-sm text-slate-500">Configura los detalles</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Template Selector */}
          {templates.length > 0 && (
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="bg-white border-b border-slate-100 py-3">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base text-slate-700">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
                  Usar Plantilla
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Información Básica */}
          <Card className={`border shadow-sm ${isMissingRequiredFields ? 'border-red-200 bg-white' : 'border-slate-200 bg-white'}`}>
            <CardHeader className={`${isMissingRequiredFields ? 'bg-red-50' : 'bg-white'} border-b border-slate-100 py-3`}>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm md:text-base text-slate-700">
                <span>Información Básica</span>
                {isMissingRequiredFields && (
                  <span className="text-xs font-normal text-red-600 bg-red-50 px-2 py-1 rounded">
                    ⚠️ Faltan campos
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="nombre" className={`text-xs md:text-sm ${!formData.nombre ? 'text-red-600' : ''}`}>
                  Nombre del Torneo *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Torneo Verano 2024"
                  className={`text-sm ${!formData.nombre ? 'border-red-300' : ''}`}
                />
                {!formData.nombre && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Campo obligatorio</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="fecha_inicio" className={`text-xs md:text-sm ${!formData.fecha_inicio ? 'text-red-600' : ''}`}>
                    Fecha y Hora *
                  </Label>
                  <Input
                    id="fecha_inicio"
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                    className={`text-sm ${!formData.fecha_inicio ? 'border-red-300' : ''}`}
                  />
                  {!formData.fecha_inicio && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Campo obligatorio</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="jugadores_por_equipo" className="text-xs md:text-sm">Jugadores/Equipo</Label>
                  <Input
                    id="jugadores_por_equipo"
                    type="number"
                    min="2"
                    value={formData.jugadores_por_equipo}
                    onChange={(e) => setFormData({...formData, jugadores_por_equipo: parseInt(e.target.value)})}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="numero_equipos" className="text-xs md:text-sm">N° Equipos</Label>
                  <Input
                    id="numero_equipos"
                    type="number"
                    min="2"
                    value={formData.numero_equipos}
                    onChange={(e) => setFormData({...formData, numero_equipos: parseInt(e.target.value)})}
                    className={`text-sm ${!hasEnoughPlayers ? 'border-red-300' : ''}`}
                  />
                  {!hasEnoughPlayers && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">
                      ⚠️ Necesitas {totalPlayersNeeded} jugadores. Disponibles: {allPlayers.length}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duracion_partido" className="text-xs md:text-sm">Duración Partido (min)</Label>
                  <Input
                    id="duracion_partido"
                    type="number"
                    min="10"
                    value={formData.duracion_partido_minutos}
                    onChange={(e) => setFormData({...formData, duracion_partido_minutos: parseInt(e.target.value)})}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="puntos_por_set" className="text-xs md:text-sm">Puntos/Set</Label>
                  <Input
                    id="puntos_por_set"
                    type="number"
                    value={formData.puntos_por_set}
                    onChange={(e) => setFormData({...formData, puntos_por_set: parseInt(e.target.value)})}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formato del Torneo */}
          <Card className="border border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
              <CardTitle className="text-sm md:text-base">Formato</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="formato" className="text-xs md:text-sm">Tipo</Label>
                <Select value={formData.formato} onValueChange={(value) => setFormData({...formData, formato: value})}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos_contra_todos">Todos vs Todos</SelectItem>
                    <SelectItem value="grupos">Grupos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="criterio_ganador" className="text-xs md:text-sm">Criterio Ganador</Label>
                  <Select value={formData.criterio_ganador} onValueChange={(value) => setFormData({...formData, criterio_ganador: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sets">Por Sets</SelectItem>
                      <SelectItem value="partidos_ganados">Por Partidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="criterio_empate" className="text-xs md:text-sm">Desempate</Label>
                  <Select value={formData.criterio_empate} onValueChange={(value) => setFormData({...formData, criterio_empate: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diferencia_puntos">Dif. Puntos</SelectItem>
                      <SelectItem value="puntos_a_favor">Puntos a Favor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h3 className="font-semibold text-slate-900 text-xs md:text-sm">Fase Final</h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <Label htmlFor="jugar_final" className="font-semibold cursor-pointer text-xs md:text-sm">Jugar Final</Label>
                    <p className="text-xs text-slate-600">Mejores 2 equipos</p>
                  </div>
                  <Switch
                    id="jugar_final"
                    checked={formData.jugar_final}
                    onCheckedChange={(checked) => setFormData({...formData, jugar_final: checked, jugar_semifinal: checked ? formData.jugar_semifinal : false})}
                    className="data-[state=checked]:bg-slate-700"
                  />
                </div>

                {formData.jugar_final && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <Label htmlFor="jugar_semifinal" className="font-semibold cursor-pointer text-xs md:text-sm">Semifinales</Label>
                      <p className="text-xs text-slate-600">Mejores 4 equipos</p>
                    </div>
                    <Switch
                      id="jugar_semifinal"
                      checked={formData.jugar_semifinal}
                      onCheckedChange={(checked) => setFormData({...formData, jugar_semifinal: checked})}
                      className="data-[state=checked]:bg-slate-700"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logística */}
          <Card className="border border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
              <CardTitle className="text-sm md:text-base">Logística</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="cervezas" className="text-xs md:text-sm">Cervezas/persona</Label>
                  <Input
                    id="cervezas"
                    type="number"
                    min="0"
                    value={formData.cervezas_por_persona}
                    onChange={(e) => setFormData({...formData, cervezas_por_persona: parseInt(e.target.value)})}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="bebidas" className="text-xs md:text-sm">Bebidas/persona</Label>
                  <Input
                    id="bebidas"
                    type="number"
                    min="0"
                    value={formData.bebidas_por_persona}
                    onChange={(e) => setFormData({...formData, bebidas_por_persona: parseInt(e.target.value)})}
                    className="text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Label htmlFor="snacks" className="cursor-pointer text-xs md:text-sm">Snacks</Label>
                  <Switch
                    id="snacks"
                    checked={formData.snacks}
                    onCheckedChange={(checked) => setFormData({...formData, snacks: checked})}
                    className="data-[state=checked]:bg-slate-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Presupuesto Estimado</p>
                  <p className="text-2xl md:text-4xl font-bold text-slate-900">₪{calculateCost()}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.jugadores_por_equipo * formData.numero_equipos} participantes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl("Home"))}
              className="text-xs md:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className={`text-xs md:text-sm ${canSubmit ? 'bg-slate-700 hover:bg-slate-800' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Crear
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}