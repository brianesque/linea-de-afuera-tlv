import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BulkPlayerDialog({ open, onOpenChange }) {
  const [players, setPlayers] = useState([
    { nombre: "", calificacion: 3, genero: "masculino" },
    { nombre: "", calificacion: 3, genero: "masculino" },
  ]);

  const queryClient = useQueryClient();

  const bulkCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setPlayers([{ nombre: "", calificacion: 3, genero: "masculino" }, { nombre: "", calificacion: 3, genero: "masculino" }]);
      onOpenChange(false);
    },
  });

  const addPlayer = () => {
    setPlayers([...players, { nombre: "", calificacion: 3, genero: "masculino" }]);
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index, field, value) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validPlayers = players.filter(p => p.nombre.trim() !== "");
    if (validPlayers.length > 0) {
      bulkCreateMutation.mutate(validPlayers);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar Varios Jugadores
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-4">
            {players.map((player, index) => (
              <Card key={index} className="border-2 border-sky-100">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto,auto] gap-3 items-end">
                    <div>
                      <Label htmlFor={`nombre-${index}`}>Nombre</Label>
                      <Input
                        id={`nombre-${index}`}
                        value={player.nombre}
                        onChange={(e) => updatePlayer(index, 'nombre', e.target.value)}
                        placeholder="Nombre del jugador"
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <Label htmlFor={`gen-${index}`}>Género</Label>
                      <Select
                        value={player.genero}
                        onValueChange={(value) => updatePlayer(index, 'genero', value)}
                      >
                        <SelectTrigger id={`gen-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">M</SelectItem>
                          <SelectItem value="femenino">F</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-32">
                      <Label htmlFor={`cal-${index}`}>Calificación</Label>
                      <Select
                        value={player.calificacion.toString()}
                        onValueChange={(value) => updatePlayer(index, 'calificacion', parseInt(value))}
                      >
                        <SelectTrigger id={`cal-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{num}</span>
                                <div className="flex gap-1">
                                  {[...Array(num)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlayer(index)}
                      disabled={players.length === 1}
                      className="hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addPlayer}
            className="w-full border-2 border-dashed border-sky-300 hover:bg-sky-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Otro Jugador
          </Button>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-sky-500 to-blue-600"
              disabled={bulkCreateMutation.isPending}
            >
              {bulkCreateMutation.isPending ? "Creando..." : `Crear ${players.filter(p => p.nombre.trim()).length} Jugador(es)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}