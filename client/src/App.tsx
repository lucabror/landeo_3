import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import HotelSetup from "@/pages/hotel-setup";
import GuestProfiles from "@/pages/guest-profiles";
import LocalExperiences from "@/pages/local-experiences";
import Itineraries from "@/pages/itineraries";
import ItineraryView from "@/pages/itinerary-view";
import ResetPasswordPage from "@/pages/reset-password";
import GuestPreferencesPage from "@/pages/guest-preferences";
import AdminDashboard from "@/pages/admin-dashboard";
import UserProfile from "@/pages/user-profile";
import HotelLogin from "@/pages/hotel-login";
import AdminLogin from "@/pages/admin-login";

function Router() {
  return (
    <Switch>
      {/* Main dashboard */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Hotel management */}
      <Route path="/hotel-setup" component={HotelSetup} />
      
      {/* Guest profiles management */}
      <Route path="/guest-profiles" component={GuestProfiles} />
      
      {/* Local experiences management */}
      <Route path="/local-experiences" component={LocalExperiences} />
      
      {/* Itineraries management */}
      <Route path="/itineraries" component={Itineraries} />
      
      {/* Public itinerary view (for guests) */}
      <Route path="/itinerary/:uniqueUrl" component={ItineraryView} />
      
      {/* Public guest preferences form */}
      <Route path="/guest-preferences/:token">
        {(params) => <GuestPreferencesPage token={params.token} />}
      </Route>
      
      {/* User profile */}
      <Route path="/profile" component={UserProfile} />
      
      {/* Login pages */}
      <Route path="/login" component={HotelLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      
      {/* Admin dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      
      {/* QR Code & PDF page redirects to itineraries for now */}
      <Route path="/qr-pdf" component={Itineraries} />
      
      {/* Password reset */}
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
