import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, Search, Users, LayoutGrid, List, Filter } from "lucide-react";
import { toast } from "sonner";
import BulkPlayerDialog from "../components/players/BulkPlayerDialog";

export default function Players() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [generoFilter, setGeneroFilter] = useState("todos");
  const [calificacionFilter, setCalificacionFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [formData, setFormData] = useState({
    nombre: "",
    calificacion: 3,
    genero: "masculino"
  });

  const queryClient = useQueryClient();

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

  const isAdmin = user?.role === 'admin';

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('nombre'),
    initialData: [],
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Jugador creado exitosamente");
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsDialogOpen(false);
      setEditingPlayer(null);
      resetForm();
      toast.success("Jugador actualizado");
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success("Jugador eliminado");
    },
  });

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      if (searchTerm && !player.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (generoFilter !== "todos" && player.genero !== generoFilter) {
        return false;
      }

      if (calificacionFilter !== "todos") {
        const targetRating = parseInt(calificacionFilter);
        if (player.calificacion !== targetRating) {
          return false;
        }
      }

      return true;
    });
  }, [players, searchTerm, generoFilter, calificacionFilter]);

  const resetForm = () => {
    setFormData({ nombre: "", calificacion: 3, genero: "masculino" });
    setEditingPlayer(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure genero is set, fallback to masculino if missing
    const dataToSubmit = {
      ...formData,
      genero: formData.genero || "masculino"
    };
    
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data: dataToSubmit });
    } else {
      createPlayerMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      nombre: player.nombre,
      calificacion: player.calificacion,
      genero: player.genero || "masculino"
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este jugador?")) {
      deletePlayerMutation.mutate(id);
    }
  };

  const PlayerCard = ({ player }) => (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base mb-1">{player.nombre}</h3>
            <Badge className={player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}>
              {player.genero === "femenino" ? "Femenino" : "Masculino"}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= player.calificacion
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300"
              }`}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(player)}
              className="flex-1 text-xs"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(player.id)}
              className="flex-1 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Eliminar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Jugadores</h1>
            <p className="text-sm text-slate-600">Gestión de jugadores del torneo</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsBulkDialogOpen(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 text-xs"
              >
                <Users className="w-3 h-3 mr-1" />
                Carga Masiva
              </Button>
              <BulkPlayerDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen} />
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Nuevo Jugador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPlayer ? "Editar Jugador" : "Nuevo Jugador"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="genero">Género</Label>
                      <Select value={formData.genero} onValueChange={(value) => setFormData({...formData, genero: value})}>
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
                      <Label htmlFor="calificacion">Calificación (1-5)</Label>
                      <Select value={formData.calificacion.toString()} onValueChange={(value) => setFormData({...formData, calificacion: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? "estrella" : "estrellas"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-slate-700 hover:bg-slate-800">
                        {editingPlayer ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6 border border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              Buscar y Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <Select value={generoFilter} onValueChange={setGeneroFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los géneros</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>

              <Select value={calificacionFilter} onValueChange={setCalificacionFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Calificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las calificaciones</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrellas)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (4 estrellas)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (3 estrellas)</SelectItem>
                  <SelectItem value="2">⭐⭐ (2 estrellas)</SelectItem>
                  <SelectItem value="1">⭐ (1 estrella)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(searchTerm || generoFilter !== "todos" || calificacionFilter !== "todos") && (
                  <>
                    <p className="text-xs text-slate-600">
                      Mostrando {filteredPlayers.length} de {players.length} jugadores
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setGeneroFilter("todos");
                        setCalificacionFilter("todos");
                      }}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  </>
                )}
              </div>

              <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-none text-xs ${viewMode === "grid" ? "bg-slate-700 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  <LayoutGrid className="w-3 h-3 mr-1" />
                  Grid
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`rounded-none text-xs ${viewMode === "list" ? "bg-slate-700 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  <List className="w-3 h-3 mr-1" />
                  Lista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-40 bg-slate-100" />
              </Card>
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-14 h-14 text-slate-400 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No se encontraron jugadores
              </h3>
              <p className="text-slate-600 text-center text-sm">
                {(searchTerm || generoFilter !== "todos" || calificacionFilter !== "todos")
                  ? "Prueba ajustando los filtros"
                  : isAdmin ? "Comienza agregando jugadores" : "Aún no hay jugadores registrados"}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <Card className="border border-slate-200">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-sm mb-1">{player.nombre}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${player.genero === "femenino" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}`}>
                              {player.genero === "femenino" ? "F" : "M"}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= player.calificacion
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(player)}
                              className="text-xs"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(player.id)}
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}