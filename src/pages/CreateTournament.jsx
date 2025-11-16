import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Trophy, Save, Copy } from "lucide-react";

export default function CreateTournament() {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    numero_equipos: 4,
    jugadores_por_equipo: 4,
    cervezas_por_persona: 3,
    snacks: true,
    bebidas_por_persona: 2,
    fecha_inicio: "",
    formato: "todos_contra_todos",
    criterio_ganador: "sets",
    criterio_empate: "diferencia_puntos",
    costo_total: 0,
    duracion_partido_minutos: 30,
    estado: "configuracion"
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TournamentTemplate.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tournament.create(data),
    onSuccess: (tournament) => {
      navigate(createPageUrl(`TournamentDetail?id=${tournament.id}`));
    },
  });

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template_id: templateId,
        jugadores_por_equipo: template.jugadores_por_equipo,
        cervezas_por_persona: template.cervezas_por_persona,
        snacks: template.snacks,
        bebidas_por_persona: template.bebidas_por_persona,
        formato: template.formato,
        criterio_ganador: template.criterio_ganador,
        criterio_empate: template.criterio_empate,
        duracion_partido_minutos: template.duracion_partido_minutos
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
            <p className="text-gray-600">Configura los parámetros de tu torneo de beach vóley</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Plantilla */}
            {templates.length > 0 && (
              <Card className="border-2 border-purple-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="w-5 h-5 text-purple-600" />
                    Usar Plantilla (Opcional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Label htmlFor="template">Selecciona una plantilla guardada</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin plantilla - Configuración manual" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin plantilla</SelectItem>
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
            <Card className="border-2 border-sky-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-sky-600" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Torneo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Torneo de Verano 2024"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio *</Label>
                    <Input
                      id="fecha_inicio"
                      type="datetime-local"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero_equipos">Número de Equipos *</Label>
                    <Input
                      id="numero_equipos"
                      type="number"
                      min="2"
                      max="16"
                      value={formData.numero_equipos}
                      onChange={(e) => setFormData({ ...formData, numero_equipos: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="jugadores_por_equipo">Jugadores por Equipo *</Label>
                    <Input
                      id="jugadores_por_equipo"
                      type="number"
                      min="2"
                      max="10"
                      value={formData.jugadores_por_equipo}
                      onChange={(e) => setFormData({ ...formData, jugadores_por_equipo: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formato del Torneo */}
            <Card className="border-2 border-orange-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100">
                <CardTitle>Formato del Torneo</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formato">Formato *</Label>
                    <Select
                      value={formData.formato}
                      onValueChange={(value) => setFormData({ ...formData, formato: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos_contra_todos">Todos contra Todos</SelectItem>
                        <SelectItem value="grupos">Grupos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duracion_partido_minutos">Duración del Partido (min)</Label>
                    <Input
                      id="duracion_partido_minutos"
                      type="number"
                      min="15"
                      max="120"
                      value={formData.duracion_partido_minutos}
                      onChange={(e) => setFormData({ ...formData, duracion_partido_minutos: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="criterio_ganador">Criterio para Ganador</Label>
                    <Select
                      value={formData.criterio_ganador}
                      onValueChange={(value) => setFormData({ ...formData, criterio_ganador: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sets">Por Sets</SelectItem>
                        <SelectItem value="partidos_ganados">Por Partidos Ganados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="criterio_empate">En Caso de Empate</Label>
                    <Select
                      value={formData.criterio_empate}
                      onValueChange={(value) => setFormData({ ...formData, criterio_empate: value })}
                    >
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
              </CardContent>
            </Card>

            {/* Logística */}
            <Card className="border-2 border-green-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
                <CardTitle>Logística y Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cervezas_por_persona">Cervezas por Persona</Label>
                    <Input
                      id="cervezas_por_persona"
                      type="number"
                      min="0"
                      value={formData.cervezas_por_persona}
                      onChange={(e) => setFormData({ ...formData, cervezas_por_persona: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bebidas_por_persona">Bebidas/Aguas por Persona</Label>
                    <Input
                      id="bebidas_por_persona"
                      type="number"
                      min="0"
                      value={formData.bebidas_por_persona}
                      onChange={(e) => setFormData({ ...formData, bebidas_por_persona: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costo_total">Costo Total (₪)</Label>
                    <Input
                      id="costo_total"
                      type="number"
                      min="0"
                      value={formData.costo_total}
                      onChange={(e) => setFormData({ ...formData, costo_total: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                  <div>
                    <Label htmlFor="snacks" className="text-base font-semibold">
                      ¿Incluir Snacks?
                    </Label>
                    <p className="text-sm text-gray-600">₪15 por equipo (papas, frutos secos, etc.)</p>
                  </div>
                  <Switch
                    id="snacks"
                    checked={formData.snacks}
                    onCheckedChange={(checked) => setFormData({ ...formData, snacks: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(createPageUrl("Home"))}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                disabled={createMutation.isPending}
              >
                <Save className="w-5 h-5 mr-2" />
                {createMutation.isPending ? "Creando..." : "Crear Torneo"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}