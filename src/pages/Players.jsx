import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Star, UserPlus, Edit2, Trash2, LayoutGrid, List, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BulkPlayerDialog from "../components/players/BulkPlayerDialog";

export default function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", calificacion: 3, genero: "masculino" });
  const [viewMode, setViewMode] = useState("grid");

  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('nombre'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowDialog(false);
      setFormData({ nombre: "", calificacion: 3, genero: "masculino" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowDialog(false);
      setEditingPlayer(null);
      setFormData({ nombre: "", calificacion: 3, genero: "masculino" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const filteredPlayers = players.filter(player =>
    player.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (player) => {
    setEditingPlayer(player);
    setFormData({ nombre: player.nombre, calificacion: player.calificacion, genero: player.genero || "masculino" });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingPlayer(null);
    setFormData({ nombre: "", calificacion: 3, genero: "masculino" });
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Gestión de Jugadores
          </h1>
          <p className="text-gray-600">
            Administra tu base de datos de jugadores y sus calificaciones
          </p>
        </div>

        <Card className="mb-6 border-2 border-orange-100 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar jugador por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-none h-12 w-12 ${viewMode === "grid" ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white" : ""}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`rounded-none h-12 w-12 ${viewMode === "list" ? "bg-sky-500 text-white hover:bg-sky-600 hover:text-white" : ""}`}
                  >
                    <List className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowBulkDialog(true)}
                  className="h-12"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Agregar Varios
                </Button>
                <Button
                  size="lg"
                  onClick={openCreateDialog}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 h-12"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nuevo Jugador
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Display */}
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32 bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UserPlus className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "No se encontraron jugadores" : "No hay jugadores registrados"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "Prueba con otro término de búsqueda" : "Comienza agregando tu primer jugador"}
              </p>
              {!searchTerm && (
                <Button size="lg" onClick={openCreateDialog} className="bg-gradient-to-r from-sky-500 to-blue-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar Primer Jugador
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => (
              <Card
                key={player.id}
                className="hover:shadow-lg transition-all duration-300 border-2 border-sky-100 hover:border-sky-300 bg-gradient-to-br from-white to-sky-50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {player.nombre}
                      </CardTitle>
                      <Badge className={`mt-2 ${player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}`}>
                        {player.genero === "femenino" ? "Femenino" : "Masculino"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(player)}
                        className="h-8 w-8 hover:bg-sky-100"
                      >
                        <Edit2 className="w-4 h-4 text-sky-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(player.id)}
                        className="h-8 w-8 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Calificación:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= player.calificacion
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-sky-100 shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 hover:bg-sky-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.nombre[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{player.nombre}</p>
                          <Badge className={`${player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}`}>
                            {player.genero === "femenino" ? "F" : "M"}
                          </Badge>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= player.calificacion
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(player)}
                        className="hover:bg-sky-100"
                      >
                        <Edit2 className="w-4 h-4 text-sky-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(player.id)}
                        className="hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlayer ? "Editar Jugador" : "Nuevo Jugador"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Jugador</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="genero">Género</Label>
                  <Select
                    value={formData.genero}
                    onValueChange={(value) => setFormData({ ...formData, genero: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="calificacion">
                    Calificación (1 = Principiante, 5 = Avanzado)
                  </Label>
                  <Select
                    value={formData.calificacion.toString()}
                    onValueChange={(value) => setFormData({ ...formData, calificacion: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{num}</span>
                            <div className="flex gap-1">
                              {[...Array(num)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-sky-500 to-blue-600">
                  {editingPlayer ? "Guardar Cambios" : "Crear Jugador"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <BulkPlayerDialog 
          open={showBulkDialog} 
          onOpenChange={setShowBulkDialog}
        />
      </div>
    </div>
  );
}