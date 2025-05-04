
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import WorkspacePage from "./pages/WorkspacePage";
import PageView from "./pages/PageView";
import SharedPage from "./pages/SharedPage";
import SharedWorkspace from "./pages/SharedWorkspace";

const queryClient = new QueryClient();

// Component to restore last path on page load
const RestoreLastPath = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're on the root path
    if (location.pathname === '/') {
      const lastPath = localStorage.getItem('lastPath');
      
      // Check if lastPath is valid and not the root
      if (lastPath && lastPath !== '/' && !lastPath.includes('undefined')) {
        navigate(lastPath);
      }
    } else {
      // Always store the current path for later restoration
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WorkspaceProvider>
        <RestoreLastPath />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
          <Route path="/workspace/:workspaceId/page/:pageId" element={<PageView />} />
          <Route path="/share/page/:pageId" element={<SharedPage />} />
          <Route path="/share/workspace/:workspaceId" element={<SharedWorkspace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </WorkspaceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
