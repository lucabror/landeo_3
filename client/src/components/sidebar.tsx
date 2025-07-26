import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Hotel, 
  Users, 
  MapPin, 
  Route, 
  QrCode,
  User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Dati Hotel", href: "/hotel-setup", icon: Hotel },
  { name: "Profili Ospiti", href: "/guest-profiles", icon: Users },
  { name: "Esperienze Locali", href: "/local-experiences", icon: MapPin },
  { name: "Profilo Utente", href: "/profile", icon: User },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm h-screen sticky top-0 border-r border-gray-200">
      <div className="p-6">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
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
    </div>
  );
}
