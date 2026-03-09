import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PostJob from "./pages/PostJob";
import Admin from "./pages/Admin";
import SeekerDashboard from "./pages/SeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Companies from "./pages/Companies";
import CompanyProfile from "./pages/CompanyProfile";
import Jobs from "./pages/Jobs";
import Courses from "./pages/Courses";
import Ebooks from "./pages/Ebooks";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/my-applications" element={<SeekerDashboard />} />
            <Route path="/employer-dashboard" element={<EmployerDashboard />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/ebooks" element={<Ebooks />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
