import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Hand } from "lucide-react";

export default function OrganizationMethodSelector({ onSelectMethod }) {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-sky-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-sky-100 to-blue-100">
          <CardTitle className="text-center">
            ¿Cómo deseas organizar los equipos?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 mb-8">
            Elige si quieres que la IA organice automáticamente los equipos de forma equilibrada, o si prefieres organizarlos manualmente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => onSelectMethod('ai')}
            >
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Organizar con IA</h3>
                <p className="text-sm text-gray-600 mb-4">
                  La IA equilibrará automáticamente los equipos considerando género, nivel y capitanes
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMethod('ai');
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Usar IA
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => onSelectMethod('manual')}
            >
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Hand className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Organizar Manualmente</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Arrastra y suelta jugadores entre equipos para organizarlos como prefieras
                </p>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMethod('manual');
                  }}
                >
                  <Hand className="w-4 h-4 mr-2" />
                  Organizar Manual
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}