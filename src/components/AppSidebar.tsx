import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  ShoppingCart,
  UtensilsCrossed,
  LogOut,
  Settings
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { title: 'לוח בקרה', url: '/', icon: LayoutDashboard },
  { title: 'מוצרים', url: '/products', icon: Package },
  { title: 'מתכונים', url: '/recipes', icon: ChefHat },
  { title: 'תכנון ארוחות', url: '/meals', icon: UtensilsCrossed },
  { title: 'רשימת קניות', url: '/shopping-list', icon: ShoppingCart },
  { title: 'הגדרות', url: '/settings', icon: Settings },
];

export const AppSidebar = () => {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const { signOut, user } = useAuth();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    toast.success('התנתקת בהצלחה');
  };

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg">מלאי מזון</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {user && (
          <div className="flex flex-col gap-2">
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground truncate px-2">
                {user.email}
              </p>
            )}
            <Button 
              variant="ghost" 
              size={isCollapsed ? "icon" : "sm"}
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="me-2">התנתק</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
