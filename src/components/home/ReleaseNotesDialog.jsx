import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, BarChart3, Users, MessageCircle, Sparkles, X } from "lucide-react";

const RELEASE_VERSION = "1.0.0";
const STORAGE_KEY = "release_notes_seen";

export default function ReleaseNotesDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    if (seenVersion !== RELEASE_VERSION) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, RELEASE_VERSION);
    setOpen(false);
  };

  const features = [
    {
      icon: Trophy,
      title: "Torneos en Curso y Finalizados",
      description: "Visualiza todos los torneos activos y los ya completados con sus resultados."
    },
    {
      icon: BarChart3,
      title: "Estadísticas por Jugador",
      description: "Consulta estadísticas básicas de cada jugador y accede a métricas avanzadas al seleccionar uno."
    },
    {
      icon: Users,
      title: "Comparar Jugadores",
      description: "Compara el rendimiento entre hasta 3 jugadores para analizar sus estadísticas lado a lado."
    },
    {
      icon: MessageCircle,
      title: "Chat y Comentarios",
      description: "Chat en vivo durante los torneos en curso y muro de comentarios en los torneos finalizados."
    }
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) localStorage.setItem(STORAGE_KEY, RELEASE_VERSION);
      setOpen(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <DialogTitle className="text-lg">¡Novedades!</DialogTitle>
            </div>
            <Badge className="bg-slate-700 text-white text-xs">v{RELEASE_VERSION}</Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Bienvenido a Línea De Afuera. Estas son las funcionalidades disponibles:
          </p>
          
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{feature.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleClose} className="w-full bg-slate-700 hover:bg-slate-800">
          ¡Entendido!
        </Button>
      </DialogContent>
    </Dialog>
  );
}