import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/hooks/use-auth";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import DiscoverMore from "@/pages/discover-more";
import Features from "@/pages/features";
import Pricing from "@/pages/pricing";
import Support from "@/pages/support";
import Contact from "@/pages/contact";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
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
import AdminProfile from "@/pages/admin-profile";
import HotelRegister from "@/pages/hotel-register";
import EmailVerification from "@/pages/email-verification";
import RegistrationConfirmed from "@/pages/registration-confirmed";

import UniversalLogin from "@/pages/universal-login";

function Router() {
  useScrollToTop(); // Auto scroll to top on route change

  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={Landing} />

      {/* Discover more page */}
      <Route path="/discover-more" component={DiscoverMore} />

      {/* Footer pages */}
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/support" component={Support} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />

      {/* Main dashboard */}
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

      {/* Universal Login */}
      <Route path="/login" component={UniversalLogin} />

      {/* Hotel Registration */}
      <Route path="/hotel-register" component={HotelRegister} />

      {/* Email Verification */}
      <Route path="/verify-email/:token">
        {(params) => <EmailVerification token={params.token} />}
      </Route>

      {/* Registration Confirmed */}
      <Route path="/registration-confirmed/:token">
        {(params) => <RegistrationConfirmed token={params.token} />}
      </Route>

      {/* Legacy login routes (redirect to universal) */}
      <Route path="/hotel-login" component={() => <UniversalLogin />} />
      <Route path="/admin-login" component={() => <UniversalLogin />} />

      {/* Admin dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-profile">
        {() => (
          <ProtectedRoute requiredRole="admin">
            <AdminProfile />
          </ProtectedRoute>
        )}
      </Route>

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