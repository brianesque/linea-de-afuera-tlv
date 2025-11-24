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
import { Plus, Trash2, Star, FileText, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BulkPlayerDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState("manual"); // manual, paste
  const [pasteContent, setPasteContent] = useState("");
  const [players, setPlayers] = useState([
    { nombre: "", calificacion: 3, genero: "masculino" },
    { nombre: "", calificacion: 3, genero: "masculino" },
  ]);

  const processPaste = () => {
    if (!pasteContent.trim()) return;
    
    const lines = pasteContent.split(/\n/);
    const newPlayers = lines.map(line => {
      if (!line.trim()) return null;
      // Try to parse: Name [separator] Gender [separator] Rating
      // Simple heuristic: First part is name.
      // If contains "fem" or "F" -> female, else male default?
      // If contains number 1-5 -> rating
      
      const parts = line.split(/[\t,;]+/);
      const nombre = parts[0]?.trim();
      
      if (!nombre) return null;

      let genero = "masculino";
      let calificacion = 3;

      // Look for gender and rating in other parts
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].toLowerCase().trim();
        if (part === 'f' || part.includes('fem') || part.includes('mujer')) genero = "femenino";
        if (part === 'm' || part.includes('masc') || part.includes('hombre')) genero = "masculino";
        
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= 5) calificacion = num;
      }
      
      return { nombre, genero, calificacion };
    }).filter(Boolean);

    if (newPlayers.length > 0) {
      setPlayers([...players, ...newPlayers]);
      setPasteContent("");
      setMode("manual");
    }
  };

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
        <Tabs value={mode} onValueChange={setMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
            <TabsTrigger value="paste">Pegar Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
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
          </TabsContent>

          <TabsContent value="paste">
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                <p className="font-semibold mb-2">Instrucciones:</p>
                <p>Pega tu lista de jugadores aquí. Cada línea es un nuevo jugador.</p>
                <p className="mt-2 text-xs text-slate-500">Formato detectado automáticamente:</p>
                <ul className="list-disc pl-4 mt-1 text-xs text-slate-500">
                  <li>Nombre (obligatorio)</li>
                  <li>Género (opcional, ej: "F", "Fem", "M", "Masc")</li>
                  <li>Calificación (opcional, número 1-5)</li>
                </ul>
                <p className="mt-2 text-xs italic">Ejemplo: Juan Perez, M, 4</p>
              </div>
              
              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Juan Perez, 4, M&#10;Maria Gonzalez, 5, F&#10;..."
                className="min-h-[200px] font-mono text-sm"
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={processPaste}
                  className="bg-slate-700 hover:bg-slate-800"
                  disabled={!pasteContent.trim()}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Procesar y Revisar
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}