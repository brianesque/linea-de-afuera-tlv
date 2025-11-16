import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Templates() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    jugadores_por_equipo: 2,
    formato: "todos_contra_todos",
    criterio_ganador: "sets",
    criterio_empate: "diferencia_puntos",
    jugar_semifinal: false,
    jugar_final: false,
    duracion_partido_minutos: 30,
    puntos_por_set: 15,
    cervezas_por_persona: 2,
    bebidas_por_persona: 2,
    snacks: true,
  });

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TournamentTemplate.list('nombre'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TournamentTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowDialog(false);
      setFormData({
        nombre: "",
        jugadores_por_equipo: 2,
        formato: "todos_contra_todos",
        criterio_ganador: "sets",
        criterio_empate: "diferencia_puntos",
        jugar_semifinal: false,
        jugar_final: false,
        duracion_partido_minutos: 30,
        puntos_por_set: 15,
        cervezas_por_persona: 2,
        bebidas_por_persona: 2,
        snacks: true,
      });
      toast.success("Plantilla creada exitosamente");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TournamentTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowDialog(false);
      setEditingTemplate(null);
      toast.success("Plantilla actualizada exitosamente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TournamentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success("Plantilla eliminada exitosamente");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    setFormData({
      nombre: template.nombre,
      jugadores_por_equipo: template.jugadores_por_equipo,
      formato: template.formato,
      criterio_ganador: template.criterio_ganador || "sets",
      criterio_empate: template.criterio_empate || "diferencia_puntos",
      jugar_semifinal: template.jugar_semifinal || false,
      jugar_final: template.jugar_final || false,
      duracion_partido_minutos: template.duracion_partido_minutos || 30,
      puntos_por_set: template.puntos_por_set || 15,
      cervezas_por_persona: template.cervezas_por_persona || 2,
      bebidas_por_persona: template.bebidas_por_persona || 2,
      snacks: template.snacks || false,
    });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      nombre: "",
      jugadores_por_equipo: 2,
      formato: "todos_contra_todos",
      criterio_ganador: "sets",
      criterio_empate: "diferencia_puntos",
      jugar_semifinal: false,
      jugar_final: false,
      duracion_partido_minutos: 30,
      puntos_por_set: 15,
      cervezas_por_persona: 2,
      bebidas_por_persona: 2,
      snacks: true,
    });
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                Plantillas de Torneos
              </h1>
              <p className="text-sm text-slate-600">
                Administra configuraciones reutilizables
              </p>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-slate-700 hover:bg-slate-800 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48 bg-slate-100" />
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-14 h-14 text-slate-400 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No hay plantillas creadas
              </h3>
              <p className="text-slate-600 mb-4 text-center text-sm">
                Crea plantillas para configurar torneos rápidamente
              </p>
              <Button onClick={openCreateDialog} className="bg-slate-700 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Plantilla
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => (
              <Card key={template.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {template.nombre}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(template)}
                        className="h-7 w-7 hover:bg-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-700" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(template.id)}
                        className="h-7 w-7 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Jugadores por equipo:</span>
                    <span className="font-semibold text-slate-900">{template.jugadores_por_equipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Formato:</span>
                    <span className="font-semibold text-slate-900">
                      {template.formato === 'todos_contra_todos' ? 'Todos vs Todos' : 'Grupos'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Puntos por set:</span>
                    <span className="font-semibold text-slate-900">{template.puntos_por_set || 15}</span>
                  </div>
                  {template.jugar_final && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-600">
                        ✓ Jugar Final {template.jugar_semifinal && '+ Semifinales'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Torneo Estándar 2x2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="criterio_ganador">Criterio Ganador</Label>
                    <Select value={formData.criterio_ganador} onValueChange={(value) => setFormData({...formData, criterio_ganador: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sets">Por Sets</SelectItem>
                        <SelectItem value="partidos_ganados">Por Partidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="criterio_empate">Desempate</Label>
                    <Select value={formData.criterio_empate} onValueChange={(value) => setFormData({...formData, criterio_empate: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diferencia_puntos">Diferencia Puntos</SelectItem>
                        <SelectItem value="puntos_a_favor">Puntos a Favor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duracion_partido">Duración (min)</Label>
                    <Input
                      id="duracion_partido"
                      type="number"
                      min="10"
                      value={formData.duracion_partido_minutos}
                      onChange={(e) => setFormData({...formData, duracion_partido_minutos: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="puntos_por_set">Puntos por Set</Label>
                    <Input
                      id="puntos_por_set"
                      type="number"
                      min="15"
                      value={formData.puntos_por_set}
                      onChange={(e) => setFormData({...formData, puntos_por_set: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Label className="cursor-pointer">Jugar Final</Label>
                    <Switch
                      checked={formData.jugar_final}
                      onCheckedChange={(checked) => setFormData({...formData, jugar_final: checked, jugar_semifinal: checked ? formData.jugar_semifinal : false})}
                      className="data-[state=checked]:bg-slate-700"
                    />
                  </div>

                  {formData.jugar_final && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <Label className="cursor-pointer">Incluir Semifinales</Label>
                      <Switch
                        checked={formData.jugar_semifinal}
                        onCheckedChange={(checked) => setFormData({...formData, jugar_semifinal: checked})}
                        className="data-[state=checked]:bg-slate-700"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <Label htmlFor="cervezas">Cervezas/persona</Label>
                    <Input
                      id="cervezas"
                      type="number"
                      min="0"
                      value={formData.cervezas_por_persona}
                      onChange={(e) => setFormData({...formData, cervezas_por_persona: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bebidas">Bebidas/persona</Label>
                    <Input
                      id="bebidas"
                      type="number"
                      min="0"
                      value={formData.bebidas_por_persona}
                      onChange={(e) => setFormData({...formData, bebidas_por_persona: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <Label className="cursor-pointer text-sm">Snacks</Label>
                      <Switch
                        checked={formData.snacks}
                        onCheckedChange={(checked) => setFormData({...formData, snacks: checked})}
                        className="data-[state=checked]:bg-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800">
                  {editingTemplate ? "Guardar Cambios" : "Crear Plantilla"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}