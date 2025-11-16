import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, Users, Crown, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminPanel() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Rol actualizado correctamente");
    },
  });

  const handleToggleAdmin = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateUserMutation.mutate({
      id: user.id,
      data: { role: newRole }
    });
  };

  const handleInvite = () => {
    toast.success("Invitación enviada a " + email);
    setEmail("");
    setShowInviteDialog(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona usuarios y permisos de administrador
          </p>
        </div>

        <Card className="mb-6 border-2 border-purple-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Usuarios Registrados
              </div>
              <Button
                onClick={() => setShowInviteDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar Usuario
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="border-2 border-sky-100">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.email?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={user.role === 'admin' ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}>
                                {user.role === 'admin' ? (
                                  <>
                                    <Crown className="w-3 h-3 mr-1" />
                                    Administrador
                                  </>
                                ) : (
                                  "Usuario"
                                )}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Registrado: {new Date(user.created_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={user.role === 'admin' ? "destructive" : "default"}
                          onClick={() => handleToggleAdmin(user)}
                          className={user.role === 'admin' ? "" : "bg-gradient-to-r from-purple-500 to-pink-600"}
                        >
                          {user.role === 'admin' ? "Remover Admin" : "Hacer Admin"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="invite-email">Email del Usuario</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} className="bg-gradient-to-r from-purple-500 to-pink-600">
                Enviar Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}