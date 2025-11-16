import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, UserX } from "lucide-react";

export default function Admins() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name'),
    initialData: [],
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }) => 
      base44.entities.User.update(userId, { is_tournament_admin: !isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (isLoading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Administradores
          </h1>
          <p className="text-gray-600">
            Administra quién puede crear y organizar torneos
          </p>
        </div>

        <Card className="border-2 border-orange-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Usuarios Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.is_tournament_admin ? (
                      <Badge className="bg-orange-500 text-white">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrador
                      </Badge>
                    ) : (
                      <Badge variant="outline">Usuario</Badge>
                    )}
                    <Button
                      size="sm"
                      variant={user.is_tournament_admin ? "outline" : "default"}
                      onClick={() => toggleAdminMutation.mutate({ 
                        userId: user.id, 
                        isAdmin: user.is_tournament_admin 
                      })}
                      className={user.is_tournament_admin ? "" : "bg-orange-500 hover:bg-orange-600"}
                    >
                      {user.is_tournament_admin ? (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Quitar Admin
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Hacer Admin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}