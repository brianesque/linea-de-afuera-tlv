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
      show: true
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-slate-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919dd394bc675994c843030/eeac2486c_logo.png" 
                alt="Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-sm"
              />
              <div>
                <h2 className="font-bold text-lg text-slate-800">Línea De Afuera</h2>
                <p className="text-xs font-medium text-slate-500">TLV Beach Vóley</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-slate-400">
                Navegación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-slate-100 text-slate-800 font-medium' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-5 h-5" />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.title}</span>
                              {item.subtitle && (
                                <span className="text-[10px] -mt-0.5 text-slate-400">{item.subtitle}</span>
                              )}
                            </div>
                          </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <div className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-slate-700">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-slate-800">{user.email}</p>
                      <Badge className={isAdmin ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}>
                        {isAdmin ? "Administrador" : "Usuario"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-600">Modo Invitado</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogin}
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Iniciar Sesión Admin
                  </Button>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-slate-200 border-b px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2 rounded-lg transition-colors duration-200 hover:bg-slate-50 text-slate-600" />
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-slate-700" />
                <h1 className="text-lg font-bold text-slate-800">Línea De Afuera</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-slate-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}