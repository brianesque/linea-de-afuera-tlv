import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Trophy, Users, Home, LogOut, BarChart3, Settings, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
      setIsLoading(false);
    };
    loadUser();
  }, [location.pathname]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const isAdmin = user?.role === 'admin';
  
  const navigationItems = [
    {
      title: "Inicio",
      url: createPageUrl("Home"),
      icon: Home,
      show: true
    },
    {
      title: "Crear Torneo",
      url: createPageUrl("CreateTournament"),
      icon: Plus,
      show: isAdmin
    },
    {
      title: "Jugadores",
      url: createPageUrl("Players"),
      icon: Users,
      show: isAdmin
    },
    {
      title: "Estadísticas",
      url: createPageUrl("PlayerStats"),
      icon: BarChart3,
      show: true,
      badge: "Click para más"
    },
    {
      title: "Plantillas",
      url: createPageUrl("Templates"),
      icon: Settings,
      show: isAdmin
    },
    {
      title: "Administración",
      url: createPageUrl("AdminPanel"),
      icon: Settings,
      show: isAdmin
    }
  ].filter(item => item.show);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-slate-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <style>{`
          :root {
            --primary: 15 23 42;
            --primary-foreground: 255 255 255;
          }
        `}</style>
        
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Línea De Afuera</h2>
                <p className="text-xs text-slate-600 font-medium">TLV Beach Vóley</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Navegación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                            {item.badge && (
                              <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full ml-auto">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <div className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{user.email}</p>
                      <Badge className={isAdmin ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"}>
                        {isAdmin ? "Administrador" : "Usuario"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full border-slate-300 hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Modo Invitado</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogin}
                    className="w-full border-slate-300 hover:bg-slate-50"
                  >
                    Iniciar Sesión Admin
                  </Button>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-slate-700" />
                <h1 className="text-lg font-bold text-slate-900">Línea De Afuera</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}