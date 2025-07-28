import { Link } from "wouter";
import landeoLogo from "@assets/landeo def_1753695256255.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Link href="/">
              <div className="flex items-center space-x-3 mb-4">
                <div>
                  <img 
                    src={landeoLogo} 
                    alt="Landeo" 
                    className="h-10 w-auto block"
                  />
                  <div className="w-full h-px bg-gray-600 my-2"></div>
                  <p className="text-xs text-amber-300 font-medium tracking-wide whitespace-nowrap">
                    Itinerari su misura, emozioni autentiche
                  </p>
                </div>
              </div>
            </Link>
            <p className="text-gray-400 mb-4">
              La piattaforma AI per hotel italiani che trasforma ogni soggiorno in un'esperienza indimenticabile.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Prodotto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/features" className="hover:text-white transition-colors">Funzionalità</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Prezzi</Link></li>
              <li><Link href="/hotel-register" className="hover:text-white transition-colors">Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Supporto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/support" className="hover:text-white transition-colors">Centro Assistenza</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contatti</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Azienda</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">Chi Siamo</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Termini e Condizioni</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Landeo. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
}