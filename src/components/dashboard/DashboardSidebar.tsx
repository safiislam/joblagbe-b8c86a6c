import {
  BarChart3, Briefcase, Building2, Users, FileText, BookOpen,
  GraduationCap, BookMarked, MessageSquare, ShoppingCart, Activity,
  Mail, Home, Settings, Shield, PenSquare, Megaphone
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

const mainItems = [
  { title: "Overview", url: "/dashboard", icon: BarChart3 },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Companies", url: "/dashboard/companies", icon: Building2 },
  { title: "Users", url: "/dashboard/users", icon: Users },
  { title: "Applications", url: "/dashboard/applications", icon: FileText },
];

const contentItems = [
  { title: "Blog", url: "/dashboard/blog", icon: BookOpen },
  { title: "Courses", url: "/dashboard/courses", icon: GraduationCap },
  { title: "E-Books", url: "/dashboard/ebooks", icon: BookMarked },
];

const trackingItems = [
  { title: "Service Orders", url: "/dashboard/service-orders", icon: ShoppingCart },
  { title: "Contact Leads", url: "/dashboard/contacts", icon: Mail },
  { title: "User Activity", url: "/dashboard/activity", icon: Activity },
  { title: "Chat Logs", url: "/dashboard/chat-logs", icon: MessageSquare },
];

const settingsItems = [
  { title: "Site Content", url: "/dashboard/site-content", icon: PenSquare },
  { title: "Popup Banners", url: "/dashboard/popups", icon: Shield },
];

interface DashboardSidebarProps {
  pendingJobs?: number;
  pendingCourses?: number;
}

export function DashboardSidebar({ pendingJobs = 0, pendingCourses = 0 }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof mainItems, badges?: Record<string, number>) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end={item.url === "/dashboard"}
              className="hover:bg-sidebar-accent/50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  {item.title}
                  {badges?.[item.url] && badges[item.url] > 0 && (
                    <Badge className="ml-auto bg-accent text-accent-foreground text-[10px] px-1.5 py-0 h-4">
                      {badges[item.url]}
                    </Badge>
                  )}
                </span>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  const badges: Record<string, number> = {
    "/dashboard/jobs": pendingJobs,
    "/dashboard/courses": pendingCourses,
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <Shield className="h-5 w-5 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-bold text-sm">Admin Panel</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(mainItems, badges)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(contentItems, badges)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tracking & Leads</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(trackingItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(settingsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-4 py-4">
          {!collapsed && (
            <NavLink to="/" className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <Home className="h-3.5 w-3.5" /> Back to Website
            </NavLink>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
