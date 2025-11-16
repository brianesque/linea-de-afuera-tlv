import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function MatchResultInput({ match, team1, team2, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [set1Team1, setSet1Team1] = useState(match.set1_equipo1 || "");
  const [set1Team2, setSet1Team2] = useState(match.set1_equipo2 || "");
  const [set2Team1, setSet2Team1] = useState(match.set2_equipo1 || "");
  const [set2Team2, setSet2Team2] = useState(match.set2_equipo2 || "");
  const [set3Team1, setSet3Team1] = useState(match.set3_equipo1 || "");
  const [set3Team2, setSet3Team2] = useState(match.set3_equipo2 || "");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const updateMatchMutation = useMutation({
    mutationFn: (data) => base44.entities.Match.update(match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', match.tournament_id] });
      toast.success("¡Resultado actualizado!");
      setOpen(false);
      if (onUpdate) onUpdate();
    },
  });

  const validateAndCalculate = () => {
    setError("");

    // Validar que sets 1 y 2 estén completos
    if (!set1Team1 || !set1Team2 || !set2Team1 || !set2Team2) {
      setError("Los sets 1 y 2 son obligatorios");
      return null;
    }

    const s1t1 = parseInt(set1Team1);
    const s1t2 = parseInt(set1Team2);
    const s2t1 = parseInt(set2Team1);
    const s2t2 = parseInt(set2Team2);

    let setsTeam1 = 0;
    let setsTeam2 = 0;

    // Contar sets ganados
    if (s1t1 > s1t2) setsTeam1++; else setsTeam2++;
    if (s2t1 > s2t2) setsTeam1++; else setsTeam2++;

    // Si hay tercer set
    if (set3Team1 && set3Team2) {
      const s3t1 = parseInt(set3Team1);
      const s3t2 = parseInt(set3Team2);
      if (s3t1 > s3t2) setsTeam1++; else setsTeam2++;
      
      return {
        set1_equipo1: s1t1,
        set1_equipo2: s1t2,
        set2_equipo1: s2t1,
        set2_equipo2: s2t2,
        set3_equipo1: s3t1,
        set3_equipo2: s3t2,
        sets_equipo1: setsTeam1,
        sets_equipo2: setsTeam2,
        puntos_equipo1: s1t1 + s2t1 + s3t1,
        puntos_equipo2: s1t2 + s2t2 + s3t2,
        estado: 'finalizado'
      };
    }

    return {
      set1_equipo1: s1t1,
      set1_equipo2: s1t2,
      set2_equipo1: s2t1,
      set2_equipo2: s2t2,
      set3_equipo1: null,
      set3_equipo2: null,
      sets_equipo1: setsTeam1,
      sets_equipo2: setsTeam2,
      puntos_equipo1: s1t1 + s2t1,
      puntos_equipo2: s1t2 + s2t2,
      estado: 'finalizado'
    };
  };

  const handleSave = () => {
    const data = validateAndCalculate();
    if (data) {
      updateMatchMutation.mutate(data);
    }
  };

  const handleStartMatch = () => {
    updateMatchMutation.mutate({
      estado: 'en_juego'
    });
  };

  const getSetWinner = (team1Score, team2Score) => {
    if (!team1Score || !team2Score) return null;
    const s1 = parseInt(team1Score);
    const s2 = parseInt(team2Score);
    if (s1 > s2) return 1;
    if (s2 > s1) return 2;
    return null;
  };

  return (
    <>
      {match.estado === 'pendiente' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStartMatch}
          className="border-green-500 text-green-700 hover:bg-green-50"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Iniciar
        </Button>
      ) : match.estado === 'en_juego' ? (
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          Ingresar Resultado
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-gray-300"
        >
          Editar Resultado
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultado del Partido #{match.numero_partido}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-2">{team1?.nombre}</p>
                <Badge className="bg-sky-100 text-sky-800">Equipo 1</Badge>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-2">{team2?.nombre}</p>
                <Badge className="bg-orange-100 text-orange-800">Equipo 2</Badge>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Set 1 - Obligatorio */}
              <Card className="border-2 border-sky-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Set 1 <span className="text-red-500">*</span></span>
                    {getSetWinner(set1Team1, set1Team2) === 1 && <Badge className="bg-sky-600 text-white">Ganador</Badge>}
                    {getSetWinner(set1Team1, set1Team2) === 2 && <Badge className="bg-orange-600 text-white">Ganador</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Puntos"
                      value={set1Team1}
                      onChange={(e) => setSet1Team1(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Puntos"
                      value={set1Team2}
                      onChange={(e) => setSet1Team2(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Set 2 - Obligatorio */}
              <Card className="border-2 border-sky-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Set 2 <span className="text-red-500">*</span></span>
                    {getSetWinner(set2Team1, set2Team2) === 1 && <Badge className="bg-sky-600 text-white">Ganador</Badge>}
                    {getSetWinner(set2Team1, set2Team2) === 2 && <Badge className="bg-orange-600 text-white">Ganador</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Puntos"
                      value={set2Team1}
                      onChange={(e) => setSet2Team1(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Puntos"
                      value={set2Team2}
                      onChange={(e) => setSet2Team2(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Set 3 - Opcional */}
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Set 3 <span className="text-gray-400 text-sm">(Opcional)</span></span>
                    {getSetWinner(set3Team1, set3Team2) === 1 && <Badge className="bg-sky-600 text-white">Ganador</Badge>}
                    {getSetWinner(set3Team1, set3Team2) === 2 && <Badge className="bg-orange-600 text-white">Ganador</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Dejar vacío si no jugó"
                      value={set3Team1}
                      onChange={(e) => setSet3Team1(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Dejar vacío si no jugó"
                      value={set3Team2}
                      onChange={(e) => setSet3Team2(e.target.value)}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-emerald-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}