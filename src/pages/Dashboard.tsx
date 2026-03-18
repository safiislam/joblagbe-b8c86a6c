import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardJobs from "@/components/dashboard/DashboardJobs";
import DashboardCompanies from "@/components/dashboard/DashboardCompanies";
import DashboardUsers from "@/components/dashboard/DashboardUsers";
import DashboardApplications from "@/components/dashboard/DashboardApplications";
import DashboardBlog from "@/components/dashboard/DashboardBlog";
import DashboardCourses from "@/components/dashboard/DashboardCourses";
import DashboardEbooks from "@/components/dashboard/DashboardEbooks";
import DashboardServiceOrders from "@/components/dashboard/DashboardServiceOrders";
import DashboardContacts from "@/components/dashboard/DashboardContacts";
import DashboardActivity from "@/components/dashboard/DashboardActivity";
import DashboardChatLogs from "@/components/dashboard/DashboardChatLogs";
import DashboardSiteContent from "@/components/dashboard/DashboardSiteContent";
import DashboardPopups from "@/components/dashboard/DashboardPopups";
import DashboardPayments from "@/components/dashboard/DashboardPayments";
import DashboardAffiliates from "@/components/dashboard/DashboardAffiliates";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, isAdmin, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  const { data: pendingCounts } = useQuery({
    queryKey: ["dashboard-pending-counts"],
    queryFn: async () => {
      const [pendingJobs, pendingCourses] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_approved", false).eq("is_active", true),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_approved", false),
      ]);
      return { pendingJobs: pendingJobs.count ?? 0, pendingCourses: pendingCourses.count ?? 0 };
    },
    enabled: isAdmin,
  });

  if (loading || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar
          pendingJobs={pendingCounts?.pendingJobs}
          pendingCourses={pendingCounts?.pendingCourses}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/90 backdrop-blur-xl px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">Job Lagbe Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
                <User className="h-3 w-3" />
                <span className="max-w-[100px] truncate hidden sm:inline">{profile?.full_name || user?.email}</span>
              </span>
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="jobs" element={<DashboardJobs />} />
              <Route path="companies" element={<DashboardCompanies />} />
              <Route path="users" element={<DashboardUsers />} />
              <Route path="applications" element={<DashboardApplications />} />
              <Route path="blog" element={<DashboardBlog />} />
              <Route path="courses" element={<DashboardCourses />} />
              <Route path="ebooks" element={<DashboardEbooks />} />
              <Route path="payments" element={<DashboardPayments />} />
              <Route path="service-orders" element={<DashboardServiceOrders />} />
              <Route path="contacts" element={<DashboardContacts />} />
              <Route path="activity" element={<DashboardActivity />} />
              <Route path="chat-logs" element={<DashboardChatLogs />} />
              <Route path="site-content" element={<DashboardSiteContent />} />
              <Route path="popups" element={<DashboardPopups />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
