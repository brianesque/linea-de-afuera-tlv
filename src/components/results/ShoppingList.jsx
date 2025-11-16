import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Beer, Droplets, Cookie, DollarSign, TrendingUp, Package } from "lucide-react";

export default function ShoppingList({ tournament, totalParticipants, numTeams }) {
  const precioUnitarioCerveza = 7;
  const [precioUnitarioBebida, setPrecioUnitarioBebida] = useState(5);
  const snackPorEquipo = 15;
  
  const totalCervezas = Math.ceil(totalParticipants * (tournament?.cervezas_por_persona || 0));
  const bolsasHielo = Math.ceil(totalCervezas / 20);
  const precioHielo = 10;
  const totalBebidas = Math.ceil(totalParticipants * (tournament?.bebidas_por_persona || 0));
  
  const costoCervezas = totalCervezas * precioUnitarioCerveza;
  const costoBebidas = totalBebidas * precioUnitarioBebida;
  const costoSnacks = tournament?.snacks ? (snackPorEquipo * numTeams) : 0;
  const costoHielo = bolsasHielo * precioHielo;
  
  const subtotal = costoCervezas + costoBebidas + costoSnacks + costoHielo;
  const margenExtra = subtotal * 0.05;
  const totalFinal = subtotal + margenExtra;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Lista de Compras para el Supermercado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border-2 border-sky-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Participantes totales</p>
                <p className="text-3xl font-bold text-sky-600">{totalParticipants} personas</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Equipos</p>
                <p className="text-3xl font-bold text-orange-600">{numTeams}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Cervezas */}
            <div className="p-4 border-2 border-amber-200 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center gap-3 mb-3">
                <Beer className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Cervezas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Cantidad Total</Label>
                  <p className="text-2xl font-bold text-amber-700">{totalCervezas}</p>
                  <p className="text-xs text-gray-500">
                    {tournament?.cervezas_por_persona} por persona
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Precio Unitario</Label>
                  <p className="text-xl font-semibold text-gray-900">₪{precioUnitarioCerveza}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Costo Total</Label>
                  <p className="text-2xl font-bold text-green-600">₪{costoCervezas.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Hielo */}
            <div className="p-4 border-2 border-cyan-200 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-6 h-6 text-cyan-600" />
                <h3 className="text-lg font-bold text-gray-900">Bolsas de Hielo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Cantidad de Bolsas</Label>
                  <p className="text-2xl font-bold text-cyan-700">{bolsasHielo}</p>
                  <p className="text-xs text-gray-500">
                    1 bolsa cada 20 cervezas
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Precio por Bolsa</Label>
                  <p className="text-xl font-semibold text-gray-900">₪{precioHielo}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Costo Total</Label>
                  <p className="text-2xl font-bold text-green-600">₪{costoHielo.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Bebidas/Aguas */}
            <div className="p-4 border-2 border-sky-200 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <Droplets className="w-6 h-6 text-sky-600" />
                <h3 className="text-lg font-bold text-gray-900">Bebidas / Aguas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Cantidad Total</Label>
                  <p className="text-2xl font-bold text-sky-700">{totalBebidas}</p>
                  <p className="text-xs text-gray-500">
                    {tournament?.bebidas_por_persona} por persona
                  </p>
                </div>
                <div>
                  <Label htmlFor="precio-bebida" className="text-sm text-gray-600">
                    Precio Unitario (₪)
                  </Label>
                  <Input
                    id="precio-bebida"
                    type="number"
                    min="0"
                    step="0.5"
                    value={precioUnitarioBebida}
                    onChange={(e) => setPrecioUnitarioBebida(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Costo Total</Label>
                  <p className="text-2xl font-bold text-green-600">₪{costoBebidas.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Snacks */}
            {tournament?.snacks && (
              <div className="p-4 border-2 border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center gap-3 mb-3">
                  <Cookie className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">Snacks por Equipo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Total Equipos</Label>
                    <p className="text-2xl font-bold text-orange-700">{numTeams}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Precio por Equipo</Label>
                    <p className="text-xl font-semibold text-gray-900">₪{snackPorEquipo}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Papas, frutos secos, galletas
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Costo Total</Label>
                    <p className="text-2xl font-bold text-green-600">₪{costoSnacks.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen Total */}
      <Card className="border-2 border-green-200 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Resumen de Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-700">Subtotal</span>
              <span className="font-bold text-gray-900">₪{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-lg border-t-2 border-green-200 pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Margen extra (5%)</span>
              </div>
              <span className="font-bold text-green-600">₪{margenExtra.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-2xl border-t-2 border-green-300 pt-4 bg-white rounded-lg p-4 shadow-md">
              <span className="font-bold text-gray-900">TOTAL ESTIMADO</span>
              <span className="font-bold text-green-600">₪{totalFinal.toFixed(2)}</span>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Este presupuesto incluye un 5% extra para gastos adicionales o imprevistos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}