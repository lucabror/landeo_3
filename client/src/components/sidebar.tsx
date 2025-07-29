import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import { 
  LayoutDashboard, 
  Hotel, 
  Users, 
  MapPin, 
  Route, 
  QrCode,
  User,
  LogOut,
  Banknote,
  LifeBuoy
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Dati Hotel", href: "/hotel-setup", icon: Hotel },
  { name: "Profili Ospiti", href: "/guest-profiles", icon: Users },
  { name: "Esperienze Locali", href: "/local-experiences", icon: MapPin },
  { name: "Storico Acquisti", href: "/purchase-history", icon: Banknote },
  { name: "Assistenza", href: "/contact", icon: LifeBuoy },
  { name: "Profilo Utente", href: "/profile", icon: User },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-white shadow-sm h-screen sticky top-0 border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200 mb-6">
        <div>
          <img 
            src={landeoLogo} 
            alt="Landeo" 
            className="h-8 w-auto block"
          />
          <div className="w-full h-px bg-gray-200 my-2"></div>
          <p className="text-xs text-gray-500 font-medium tracking-wide leading-tight whitespace-nowrap">
            Itinerari su misura, emozioni autentiche
          </p>
        </div>
      </div>
      <div className="p-6 flex-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && item.href !== "/dashboard" && location.startsWith(item.href)) ||
              (item.href === "/dashboard" && location === "/dashboard");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* User info and logout button */}
      <div className="p-6 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">
          Connesso come
        </div>
        <div className="text-sm font-medium text-gray-900 mb-3 truncate">
          {user?.email}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
