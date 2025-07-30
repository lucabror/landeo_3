import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Chi Siamo', href: '/about' },
    { name: 'Funzionalità', href: '/features' },
    { name: 'Prezzi', href: '/pricing' },
    { name: 'Contatti', href: '/contact' }
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo Section */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="flex-shrink-0">
                <img 
                  src={landeoLogo} 
                  alt="Landeo" 
                  className="h-10 sm:h-12 w-auto block"
                />
                <p className="text-amber-700 tracking-wide whitespace-nowrap text-[15px] sm:text-[17px] font-light">
                  Itinerari su misura
                </p>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <span className="text-gray-700 hover:text-amber-700 font-medium text-sm transition-colors duration-200 cursor-pointer">
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login">
              <Button 
                variant="outline" 
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Accedi
              </Button>
            </Link>
            <Link href="/hotel-register">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900"
              >
                Demo Gratuita
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Link href="/login">
              <Button 
                variant="outline" 
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 px-2 text-xs"
              >
                Accedi
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-amber-700 hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-sm border-t border-stone-200">
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span 
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-amber-700 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
              <div className="px-3 py-2">
                <Link href="/hotel-register">
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Demo Gratuita
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}