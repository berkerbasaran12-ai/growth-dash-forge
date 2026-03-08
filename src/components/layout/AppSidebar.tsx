import { LayoutDashboard, BookOpen, Settings, Users, LogOut, FileText, Plug, Activity, Sun, Moon, Target } from "lucide-react";
import havanaLogo from "@/assets/havana-logo.png";
import { NotificationBell } from "@/components/NotificationBell";
import { SendNotificationDialog } from "@/components/SendNotificationDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const clientItems = [
  { title: "Yönetim Paneli", url: "/dashboard", icon: LayoutDashboard },
  { title: "Havana Akademi", url: "/knowledge-base", icon: BookOpen },
  { title: "Entegrasyonlar", url: "/integrations", icon: Plug },
  { title: "Ayarlar", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Yönetim Paneli", url: "/dashboard", icon: LayoutDashboard },
  { title: "Müşteri Yönetimi", url: "/admin/clients", icon: Users },
  { title: "Havana Akademi", url: "/knowledge-base", icon: BookOpen },
  { title: "İçerik Yönetimi", url: "/admin/knowledge", icon: FileText },
  { title: "Entegrasyonlar", url: "/integrations", icon: Plug },
  { title: "Aktivite Logu", url: "/admin/activity", icon: Activity },
  { title: "Ayarlar", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const items = isAdmin ? adminItems : clientItems;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img src={havanaLogo} alt="Havana Dijital" className="w-8 h-8 rounded-lg object-contain shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground tracking-tight text-sm leading-tight truncate">Havana Dijital</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">Müşteri Yönetim Portalı</p>
            </div>
          </div>
        ) : (
          <img src={havanaLogo} alt="Havana Dijital" className="w-8 h-8 rounded-lg object-contain mx-auto" />
        )}
      </SidebarHeader>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4 mb-2">Menü</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          {!collapsed && profile && (
            <div className="flex items-center gap-2.5 px-2 py-1 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} alt="Profil" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{profile.full_name || profile.email}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={theme === "dark" ? "Aydınlık Tema" : "Karanlık Tema"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationBell />
            {isAdmin && !collapsed && <SendNotificationDialog />}
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive w-full">
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Çıkış Yap</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
