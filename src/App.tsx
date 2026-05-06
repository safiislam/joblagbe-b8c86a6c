import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense, useEffect, useState } from "react";
import { MobileBottomNav } from "@/components/Header";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";

import Index from "./pages/Index";

const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
const AffiliatePopupLazy = lazy(() => import("@/components/AffiliateAds").then(m => ({ default: m.AffiliatePopup })));
const TutorialVideoButton = lazy(() => import("@/components/TutorialVideoButton"));

const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const PostJob = lazy(() => import("./pages/PostJob"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const SeekerDashboard = lazy(() => import("./pages/SeekerDashboard"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const Courses = lazy(() => import("./pages/Courses"));
const Ebooks = lazy(() => import("./pages/Ebooks"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient();

const GlobalOverlays = () => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const hideAds = location.pathname.startsWith("/dashboard") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  useEffect(() => {
    const w = window as any;
    const idle = w.requestIdleCallback
      ? w.requestIdleCallback(() => setReady(true), { timeout: 3000 })
      : window.setTimeout(() => setReady(true), 1500);
    return () => {
      if (w.cancelIdleCallback && typeof idle === "number") w.cancelIdleCallback(idle);
      else window.clearTimeout(idle as number);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <AIChatWidget />
      {!hideAds && <AffiliatePopupLazy />}
      <TutorialVideoButton />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ChunkErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
              </div>
            }
          >
            
            <div>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/post-job" element={<PostJob />} />
                
                <Route path="/dashboard/*" element={<Dashboard />} />
                <Route path="/my-applications" element={<SeekerDashboard />} />
                <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/company/:id" element={<CompanyProfile />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/ebooks" element={<Ebooks />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <MobileBottomNav />
            <GlobalOverlays />
          </Suspense>
          </ChunkErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
