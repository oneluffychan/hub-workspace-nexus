import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import WorkspacePage from "./pages/WorkspacePage";
import PageView from "./pages/PageView";
import SharedPage from "./pages/SharedPage";
import SharedWorkspace from "./pages/SharedWorkspace";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while auth is being checked
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // If not authenticated, redirect to login while preserving the intended destination
  if (!user) {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" />;
  }
  
  // User is authenticated, render the protected content
  return <>{children}</>;
};

// Route Manager Component
const RouteManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // If user is authenticated and on login/signup page, redirect to home or last path
    if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      
      if (redirectPath && redirectPath !== '/' && !redirectPath.includes('undefined')) {
        localStorage.removeItem('redirectAfterLogin'); // Clear after use
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    }
    
    // Store paths that aren't login/signup for potential restoration
    if (location.pathname !== '/login' && location.pathname !== '/signup') {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, navigate, user]);
  
  return null;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Routes */}
      <Route path="/workspace/:workspaceId" element={
        <ProtectedRoute>
          <WorkspacePage />
        </ProtectedRoute>
      } />
      <Route path="/workspace/:workspaceId/page/:pageId" element={
        <ProtectedRoute>
          <PageView />
        </ProtectedRoute>
      } />
      
      {/* Public Shared Routes */}
      <Route path="/share/page/:pageId" element={<SharedPage />} />
      <Route path="/share/workspace/:workspaceId" element={<SharedWorkspace />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <WorkspaceProvider>
            <RouteManager />
            <AppRoutes />
          </WorkspaceProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;