import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Trophy, Users, Home, LogOut, BarChart3, Settings } from "lucide-react";
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
  const navigate = useNavigate();
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
    base44.auth.logout(createPageUrl("Login"));
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
      title: "Administración",
      url: createPageUrl("AdminPanel"),
      icon: Settings,
      show: isAdmin
    }
  ].filter(item => item.show);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-amber-50 via-orange-50 to-sky-50">
        <style>{`
          :root {
            --primary: 38 92 255;
            --primary-foreground: 255 255 255;
          }
        `}</style>
        
        <Sidebar className="border-r border-orange-200/50 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-orange-200/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Línea De Afuera</h2>
                <p className="text-xs text-orange-600 font-medium">TLV Beach Vóley</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Navegación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-gradient-to-r from-orange-100 to-sky-100 text-orange-700 font-medium' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-orange-200/50 p-4">
            <div className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{user.email}</p>
                      <Badge className={isAdmin ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}>
                        {isAdmin ? "Administrador" : "Usuario"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Modo Invitado</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(createPageUrl("Login"))}
                    className="w-full"
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-orange-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-sky-600" />
                <h1 className="text-lg font-bold text-gray-900">Línea De Afuera</h1>
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