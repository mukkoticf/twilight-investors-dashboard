
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import QuarterlyRoiPage from "./pages/QuarterlyRoiPage";
import ReportsPage from "./pages/ReportsPage";
import PoolDetailsPage from "./pages/PoolDetailsPage";
import InvestorDetailPage from "./pages/InvestorDetailPage";
import InvestmentDetailPage from "./pages/InvestmentDetailPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { trackPageView } from "./utils/analytics";

// Define routes configuration
const routes = [
  { path: "/", element: <Index /> },
  { path: "/investors/quarterly-roi", element: <QuarterlyRoiPage /> },
  { path: "/reports", element: <ReportsPage /> },
  { path: "/pools/:poolId", element: <PoolDetailsPage /> },
  { path: "/investor/:investorId", element: <InvestorDetailPage /> },
  { path: "/investment/:investmentId", element: <InvestmentDetailPage /> },
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

// Application main component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <RouterChangeHandler />
          <Routes>
            {routes.map((route) => (
              <Route 
                key={route.path} 
                path={route.path} 
                element={route.element} 
              />
            ))}
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
