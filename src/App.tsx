
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import VehiclePurPage from "./pages/VehiclePurPage";
import QuarterlyRoiPage from "./pages/QuarterlyRoiPage";
import ReportsPage from "./pages/ReportsPage";
import PoolDetailsPage from "./pages/PoolDetailsPage";
import InvestorDetailPage from "./pages/InvestorDetailPage";
import InvestmentDetailPage from "./pages/InvestmentDetailPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { CRMProvider } from "./contexts/CRMContext";
import { StatisticsProvider } from "./contexts/StatisticsContext";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { trackPageView } from "./utils/analytics";

// Define routes configuration
const routes = [
  { 
    path: "/", 
    element: (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    ) 
  },
  { 
    path: "/investors/vehicle-pur", 
    element: (
      <ProtectedRoute>
        <VehiclePurPage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: "/investors/quarterly-roi", 
    element: (
      <ProtectedRoute requireAdmin={true}>
        <QuarterlyRoiPage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: "/reports", 
    element: (
      <ProtectedRoute requireAdmin={true}>
        <ReportsPage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: "/pools/:poolId", 
    element: (
      <ProtectedRoute>
        <PoolDetailsPage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: "/investor/:investorId", 
    element: (
      <ProtectedRoute>
        <InvestorDetailPage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: "/investment/:investmentId", 
    element: (
      <ProtectedRoute>
        <InvestmentDetailPage />
      </ProtectedRoute>
    ) 
  },
  { path: "*", element: <NotFound /> }
];

// Create query client with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Router change handler component
const RouterChangeHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    // Track page view for analytics
    const currentPath = location.pathname;
    const pageName = currentPath === '/' ? 'dashboard' : currentPath.replace(/^\//, '');
    trackPageView(pageName);
  }, [location.pathname]);
  
  return null;
};

// Application main component with properly nested providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppSettingsProvider>
            <CRMProvider>
              <StatisticsProvider>
                <TooltipProvider>
                  <RouterChangeHandler />
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    {routes.map((route) => (
                      <Route 
                        key={route.path} 
                        path={route.path} 
                        element={route.element} 
                      />
                    ))}
                  </Routes>
                </TooltipProvider>
              </StatisticsProvider>
            </CRMProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
