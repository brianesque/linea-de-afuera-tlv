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
        duracion_partido_minutos: template.duracion_partido_minutos || 30,
        cervezas_por_persona: template.cervezas_por_persona || 2,
        bebidas_por_persona: template.bebidas_por_persona || 2,
        snacks: template.snacks || false,
      });
      toast.success("Template aplicado");
    }
  };

  const calculateCost = () => {
    const totalParticipants = formData.jugadores_por_equipo * formData.numero_equipos;
    const beerCost = totalParticipants * formData.cervezas_por_persona * 12;
    const drinksCost = totalParticipants * formData.bebidas_por_persona * 5;
    const snacksCost = formData.snacks ? totalParticipants * 15 : 0;
    return beerCost + drinksCost + snacksCost;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.fecha_inicio) {
      toast.error("Por favor completa todos los campos obligatorios");
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="border-2 border-orange-200 hover:bg-orange-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Torneo</h1>
            <p className="text-gray-600">Configura los detalles de tu torneo de beach vóley</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selector */}
          {templates.length > 0 && (
            <Card className="border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Usar Template
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar un template..." />
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
          <Card className="border-2 border-sky-100">
            <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Torneo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Summer Beach Tournament 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_inicio">Fecha y Hora *</Label>
                  <Input
                    id="fecha_inicio"
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="jugadores_por_equipo">Jugadores por Equipo</Label>
                  <Input
                    id="jugadores_por_equipo"
                    type="number"
                    min="2"
                    value={formData.jugadores_por_equipo}
                    onChange={(e) => setFormData({...formData, jugadores_por_equipo: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="numero_equipos">Número de Equipos</Label>
                  <Input
                    id="numero_equipos"
                    type="number"
                    min="2"
                    value={formData.numero_equipos}
                    onChange={(e) => setFormData({...formData, numero_equipos: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="duracion_partido">Duración por Partido (min)</Label>
                  <Input
                    id="duracion_partido"
                    type="number"
                    min="10"
                    value={formData.duracion_partido_minutos}
                    onChange={(e) => setFormData({...formData, duracion_partido_minutos: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formato del Torneo */}
          <Card className="border-2 border-orange-100">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100">
              <CardTitle>Formato del Torneo</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="formato">Formato</Label>
                <Select value={formData.formato} onValueChange={(value) => setFormData({...formData, formato: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos_contra_todos">Todos contra Todos</SelectItem>
                    <SelectItem value="grupos">Grupos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="criterio_ganador">Criterio para Ganador</Label>
                  <Select value={formData.criterio_ganador} onValueChange={(value) => setFormData({...formData, criterio_ganador: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sets">Por Sets (Diferencia de Sets)</SelectItem>
                      <SelectItem value="partidos_ganados">Por Partidos Ganados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="criterio_empate">Criterio de Desempate</Label>
                  <Select value={formData.criterio_empate} onValueChange={(value) => setFormData({...formData, criterio_empate: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diferencia_puntos">Diferencia de Puntos</SelectItem>
                      <SelectItem value="puntos_a_favor">Puntos a Favor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Fase Final</h3>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <Label htmlFor="jugar_final" className="font-semibold">Jugar Final</Label>
                    <p className="text-sm text-gray-600">Los mejores 2 equipos juegan la final</p>
                  </div>
                  <Switch
                    id="jugar_final"
                    checked={formData.jugar_final}
                    onCheckedChange={(checked) => setFormData({...formData, jugar_final: checked, jugar_semifinal: checked ? formData.jugar_semifinal : false})}
                  />
                </div>

                {formData.jugar_final && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <Label htmlFor="jugar_semifinal" className="font-semibold">Incluir Semifinales</Label>
                      <p className="text-sm text-gray-600">Los mejores 4 juegan semifinales + final</p>
                    </div>
                    <Switch
                      id="jugar_semifinal"
                      checked={formData.jugar_semifinal}
                      onCheckedChange={(checked) => setFormData({...formData, jugar_semifinal: checked})}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logística */}
          <Card className="border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
              <CardTitle>Logística</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cervezas">Cervezas por Persona</Label>
                  <Input
                    id="cervezas"
                    type="number"
                    min="0"
                    value={formData.cervezas_por_persona}
                    onChange={(e) => setFormData({...formData, cervezas_por_persona: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="bebidas">Bebidas por Persona</Label>
                  <Input
                    id="bebidas"
                    type="number"
                    min="0"
                    value={formData.bebidas_por_persona}
                    onChange={(e) => setFormData({...formData, bebidas_por_persona: parseInt(e.target.value)})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <Label htmlFor="snacks">Incluir Snacks</Label>
                  <Switch
                    id="snacks"
                    checked={formData.snacks}
                    onCheckedChange={(checked) => setFormData({...formData, snacks: checked})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Presupuesto Estimado</p>
                  <p className="text-4xl font-bold text-green-600">₪{calculateCost()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Para {formData.jugadores_por_equipo * formData.numero_equipos} participantes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("Home"))}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Torneo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}