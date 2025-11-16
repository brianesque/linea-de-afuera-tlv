import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Edit2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MatchResultInput({ match, team1, team2 }) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState({
    set1_equipo1: match.set1_equipo1 || "",
    set1_equipo2: match.set1_equipo2 || "",
    set2_equipo1: match.set2_equipo1 || "",
    set2_equipo2: match.set2_equipo2 || "",
    set3_equipo1: match.set3_equipo1 || "",
    set3_equipo2: match.set3_equipo2 || "",
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const updateMatchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Match.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      setOpen(false);
      toast.success("Resultado guardado exitosamente");
    },
  });

  const validateScores = () => {
    const newErrors = {};
    
    // Set 1 es obligatorio
    if (!scores.set1_equipo1 || !scores.set1_equipo2) {
      newErrors.set1 = "Set 1 es obligatorio";
    }
    
    // Set 2 es obligatorio
    if (!scores.set2_equipo1 || !scores.set2_equipo2) {
      newErrors.set2 = "Set 2 es obligatorio";
    }

    // Validar que haya un ganador en cada set (diferencia de al menos 2 puntos y mínimo 21)
    const validateSet = (score1, score2, setName) => {
      const s1 = parseInt(score1);
      const s2 = parseInt(score2);
      
      if (s1 === s2) {
        newErrors[setName] = "Debe haber un ganador (diferencia mínima de 2 puntos)";
      } else if (Math.abs(s1 - s2) < 2) {
        newErrors[setName] = "Diferencia mínima de 2 puntos";
      } else {
        const winner = s1 > s2 ? s1 : s2;
        const loser = s1 > s2 ? s2 : s1;
        if (winner < 21 || (winner === 21 && loser > 19)) {
          if (winner < 21) {
            newErrors[setName] = "El ganador debe tener al menos 21 puntos";
          }
        }
      }
    };

    if (scores.set1_equipo1 && scores.set1_equipo2) {
      validateSet(scores.set1_equipo1, scores.set1_equipo2, 'set1');
    }
    
    if (scores.set2_equipo1 && scores.set2_equipo2) {
      validateSet(scores.set2_equipo1, scores.set2_equipo2, 'set2');
    }

    // Set 3 solo se valida si está completo
    if ((scores.set3_equipo1 || scores.set3_equipo2) && 
        scores.set3_equipo1 && scores.set3_equipo2) {
      validateSet(scores.set3_equipo1, scores.set3_equipo2, 'set3');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateResults = () => {
    let setsEquipo1 = 0;
    let setsEquipo2 = 0;
    let puntosEquipo1 = 0;
    let puntosEquipo2 = 0;

    // Set 1
    if (scores.set1_equipo1 && scores.set1_equipo2) {
      const s1_1 = parseInt(scores.set1_equipo1);
      const s1_2 = parseInt(scores.set1_equipo2);
      if (s1_1 > s1_2) setsEquipo1++;
      else setsEquipo2++;
      puntosEquipo1 += s1_1;
      puntosEquipo2 += s1_2;
    }

    // Set 2
    if (scores.set2_equipo1 && scores.set2_equipo2) {
      const s2_1 = parseInt(scores.set2_equipo1);
      const s2_2 = parseInt(scores.set2_equipo2);
      if (s2_1 > s2_2) setsEquipo1++;
      else setsEquipo2++;
      puntosEquipo1 += s2_1;
      puntosEquipo2 += s2_2;
    }

    // Set 3 (opcional)
    if (scores.set3_equipo1 && scores.set3_equipo2) {
      const s3_1 = parseInt(scores.set3_equipo1);
      const s3_2 = parseInt(scores.set3_equipo2);
      if (s3_1 > s3_2) setsEquipo1++;
      else setsEquipo2++;
      puntosEquipo1 += s3_1;
      puntosEquipo2 += s3_2;
    }

    return { setsEquipo1, setsEquipo2, puntosEquipo1, puntosEquipo2 };
  };

  const handleSave = () => {
    if (!validateScores()) {
      toast.error("Por favor corrige los errores en los resultados");
      return;
    }

    const { setsEquipo1, setsEquipo2, puntosEquipo1, puntosEquipo2 } = calculateResults();

    const updateData = {
      ...scores,
      set1_equipo1: parseInt(scores.set1_equipo1),
      set1_equipo2: parseInt(scores.set1_equipo2),
      set2_equipo1: parseInt(scores.set2_equipo1),
      set2_equipo2: parseInt(scores.set2_equipo2),
      set3_equipo1: scores.set3_equipo1 ? parseInt(scores.set3_equipo1) : null,
      set3_equipo2: scores.set3_equipo2 ? parseInt(scores.set3_equipo2) : null,
      sets_equipo1: setsEquipo1,
      sets_equipo2: setsEquipo2,
      puntos_equipo1: puntosEquipo1,
      puntos_equipo2: puntosEquipo2,
      estado: 'finalizado'
    };

    updateMatchMutation.mutate({ id: match.id, data: updateData });
  };

  const handleStart = () => {
    updateMatchMutation.mutate({
      id: match.id,
      data: { estado: 'en_juego' }
    });
  };

  const handleOpenDialog = () => {
    setScores({
      set1_equipo1: match.set1_equipo1 || "",
      set1_equipo2: match.set1_equipo2 || "",
      set2_equipo1: match.set2_equipo1 || "",
      set2_equipo2: match.set2_equipo2 || "",
      set3_equipo1: match.set3_equipo1 || "",
      set3_equipo2: match.set3_equipo2 || "",
    });
    setErrors({});
    setOpen(true);
  };

  return (
    <>
      {match.estado === 'pendiente' ? (
        <Button
          size="sm"
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
        >
          <Play className="w-4 h-4 mr-2" />
          Iniciar Partido
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={handleOpenDialog}
          variant={match.estado === 'finalizado' ? 'outline' : 'default'}
          className="w-full"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          {match.estado === 'finalizado' ? 'Editar Resultado' : 'Cargar Resultado'}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cargar Resultado del Partido #{match.numero_partido}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-center pb-4 border-b">
              <div>
                <p className="font-bold text-lg text-sky-600">{team1?.nombre || "Equipo 1"}</p>
              </div>
              <div>
                <p className="font-bold text-lg text-orange-600">{team2?.nombre || "Equipo 2"}</p>
              </div>
            </div>

            {/* Set 1 */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Set 1 *</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  value={scores.set1_equipo1}
                  onChange={(e) => setScores({...scores, set1_equipo1: e.target.value})}
                  placeholder="Puntos equipo 1"
                  className={errors.set1 ? "border-red-500" : ""}
                />
                <Input
                  type="number"
                  min="0"
                  value={scores.set1_equipo2}
                  onChange={(e) => setScores({...scores, set1_equipo2: e.target.value})}
                  placeholder="Puntos equipo 2"
                  className={errors.set1 ? "border-red-500" : ""}
                />
              </div>
              {errors.set1 && <p className="text-xs text-red-600 mt-1">{errors.set1}</p>}
            </div>

            {/* Set 2 */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Set 2 *</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  value={scores.set2_equipo1}
                  onChange={(e) => setScores({...scores, set2_equipo1: e.target.value})}
                  placeholder="Puntos equipo 1"
                  className={errors.set2 ? "border-red-500" : ""}
                />
                <Input
                  type="number"
                  min="0"
                  value={scores.set2_equipo2}
                  onChange={(e) => setScores({...scores, set2_equipo2: e.target.value})}
                  placeholder="Puntos equipo 2"
                  className={errors.set2 ? "border-red-500" : ""}
                />
              </div>
              {errors.set2 && <p className="text-xs text-red-600 mt-1">{errors.set2}</p>}
            </div>

            {/* Set 3 */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Set 3 (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  value={scores.set3_equipo1}
                  onChange={(e) => setScores({...scores, set3_equipo1: e.target.value})}
                  placeholder="Puntos equipo 1"
                  className={errors.set3 ? "border-red-500" : ""}
                />
                <Input
                  type="number"
                  min="0"
                  value={scores.set3_equipo2}
                  onChange={(e) => setScores({...scores, set3_equipo2: e.target.value})}
                  placeholder="Puntos equipo 2"
                  className={errors.set3 ? "border-red-500" : ""}
                />
              </div>
              {errors.set3 && <p className="text-xs text-red-600 mt-1">{errors.set3}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                ℹ️ <strong>Reglas:</strong> Cada set debe tener un ganador con al menos 21 puntos y 2 de diferencia. 
                El tercer set es opcional y se juega solo si cada equipo ganó un set.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMatchMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMatchMutation.isPending ? "Guardando..." : "Guardar Resultado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}