import { LayoutDashboard, BookOpen, Settings, Users, LogOut, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Bilgi Bankası", url: "/knowledge-base", icon: BookOpen },
  { title: "Ayarlar", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Müşteri Yönetimi", url: "/admin/clients", icon: Users },
  { title: "Bilgi Bankası", url: "/knowledge-base", icon: BookOpen },
  { title: "İçerik Yönetimi", url: "/admin/knowledge", icon: FileText },
  { title: "Ayarlar", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, signOut, profile } = useAuth();
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">Portal</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
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
        {!collapsed && profile && (
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-medium text-foreground truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        )}
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
