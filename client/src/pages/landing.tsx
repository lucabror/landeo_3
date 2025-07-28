import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import { 
  MapPin, 
  Users, 
  Zap, 
  Shield, 
  Heart, 
  Star, 
  ChevronRight, 
  Hotel, 
  Brain, 
  FileText, 
  QrCode,
  Mail,
  CheckCircle,
  Globe,
  Clock,
  Award
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-warmgray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <img 
                  src={landeoLogo} 
                  alt="Landeo" 
                  className="h-12 w-auto mb-1"
                />

              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  Accedi
                </Button>
              </Link>
              <Link href="/hotel-register">
                <Button className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900">
                  Demo Gratuita (genera 5 itinerari gratuiti)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-600/5 to-amber-600/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-6">
                🚀 Nuova Generazione di Hospitality Management
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Trasforma l'esperienza
                <span className="bg-gradient-to-r from-amber-700 to-amber-800 bg-clip-text text-transparent block">
                  dei tuoi ospiti
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                La prima piattaforma Landeo per Hotel Italiani che genera itinerari personalizzati per gli ospiti tramite l'AI e automatizza l'esperienza di soggiorno con tecnologia all'avanguardia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/hotel-register">
                  <Button size="lg" className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-lg px-8">
                    Inizia Gratis 5 itinerari gratuiti
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/discover-more">
                  <Button size="lg" variant="outline" className="border-stone-300 text-amber-800 hover:bg-stone-50 text-lg px-8">
                    Scopri di Più
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Setup in 5 minuti</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Supporto 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Made in Italy</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Itinerario AI Generato</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-amber-700" />
                    <div>
                      <p className="font-medium">Colosseo & Fori Imperiali</p>
                      <p className="text-sm text-gray-600">09:00 - 12:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <Users className="w-5 h-5 text-amber-700" />
                    <div>
                      <p className="font-medium">Pranzo tipico romano</p>
                      <p className="text-sm text-gray-600">12:30 - 14:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <Heart className="w-5 h-5 text-amber-700" />
                    <div>
                      <p className="font-medium">Fontana di Trevi</p>
                      <p className="text-sm text-gray-600">15:00 - 16:30</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              🎯 Funzionalità Avanzate
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tutto quello che serve per il tuo hotel
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una suite completa di strumenti intelligenti per trasformare il soggiorno degli ospiti in esperienze indimenticabili in Italia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-amber-200 hover:border-amber-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">AI Itinerari Personalizzati</CardTitle>
                <CardDescription>
                  L'Intelligenza artificiale avanzata genera itinerari unici basati sulle preferenze degli ospiti e sulle realtà locali entro 50km dalla sede della tua struttura.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-amber-200 hover:border-amber-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Gestione Profili Ospiti</CardTitle>
                <CardDescription>
                  Sistema completo per raccogliere preferenze, gestire soggiorni e personalizzare ogni esperienza.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-amber-200 hover:border-amber-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">QR Code & PDF</CardTitle>
                <CardDescription>
                  Genera automaticamente QR code e PDF eleganti per condividere itinerari con gli ospiti.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-amber-200 hover:border-amber-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Email Automatiche</CardTitle>
                <CardDescription>
                  Sistema di invio email automatico per PDF itinerari e comunicazioni personalizzate agli ospiti.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-amber-200 hover:border-amber-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Sicurezza Avanzata</CardTitle>
                <CardDescription>
                  Autenticazione sicura, controllo accessi e protezione dati con standard enterprise.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-amber-200 hover:border-amber-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Multilingua</CardTitle>
                <CardDescription>
                  Supporto completo per ospiti internazionali con interfaccia e contenuti multilingua.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-amber-700 to-amber-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-amber-100">Itinerari Generati</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-amber-100">Soddisfazione Ospiti</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-amber-100">Supporto Dedicato</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              🔄 Come Funziona
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Semplicissimo da usare.
            </h2>
            <p className="text-xl text-gray-600">
              Inizia in pochi minuti e trasforma subito l'esperienza dei tuoi ospiti
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Hotel className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Setup Hotel</h3>
              <p className="text-gray-600 leading-relaxed">
                Configura il profilo del tuo hotel, aggiungi le esperienze locali e personalizza il branding in pochi click.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Profili Ospiti</h3>
              <p className="text-gray-600 leading-relaxed">
                Raccogli le preferenze degli ospiti tramite form intuitivi e crea profili dettagliati per ogni soggiorno.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Magia AI</h3>
              <p className="text-gray-600 leading-relaxed">
                L'AI genera itinerari personalizzati, crea PDF eleganti e li condivide automaticamente via email e QR code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* iPhone Mockup Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
                📱 Esperienza Ospite
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Cosa vedranno i tuoi ospiti
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                I tuoi ospiti vedranno Itinerari eleganti e personalizzati accessibili tramite QR code, perfettamente ottimizzati per smartphone con design moderno e intuitivo.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Itinerario Giornaliero</h3>
                    <p className="text-gray-600">Pianificazione dettagliata con orari, luoghi e descrizioni personalizzate per ogni attività.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tempistiche Ottimizzate</h3>
                    <p className="text-gray-600">L'AI calcola i tempi di spostamento e suggerisce la sequenza perfetta delle attività.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Raccomandazioni Locali</h3>
                    <p className="text-gray-600">Esperienze autentiche selezionate dal tuo team che riflettono la vera essenza del territorio.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative">
                {/* iPhone mockup frame */}
                <div className="w-80 h-[640px] bg-black rounded-[60px] p-2 shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
                  <div className="w-full h-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-[52px] overflow-hidden relative">
                    {/* iPhone notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                    
                    {/* Screen content */}
                    <div className="p-6 pt-12 text-white">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <Hotel className="w-6 h-6" />
                          <span className="font-bold text-lg">Hotel Bellavista</span>
                        </div>
                        <QrCode className="w-6 h-6" />
                      </div>
                      
                      {/* Guest info */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
                        <h2 className="text-xl font-bold mb-2">Il Tuo Itinerario</h2>
                        <p className="text-blue-100 text-sm">Marco & Elena • 3 giorni a Roma</p>
                      </div>
                      
                      {/* Day activities */}
                      <div className="space-y-4">
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">1</span>
                            </div>
                            <span className="font-semibold">Giorno 1 - Centro Storico</span>
                          </div>
                          <div className="ml-11 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>09:00 - Colosseo</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>11:30 - Fori Imperiali</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>13:00 - Pranzo da Checchino</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">2</span>
                            </div>
                            <span className="font-semibold">Giorno 2 - Vaticano</span>
                          </div>
                          <div className="ml-11 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>08:30 - Musei Vaticani</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>12:00 - Cappella Sistina</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">3</span>
                            </div>
                            <span className="font-semibold">Giorno 3 - Trastevere</span>
                          </div>
                          <div className="ml-11 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>10:00 - Mercato locale</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-stone-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              💰 Prezzi Trasparenti
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Solo 1€ per ogni itinerario generato!
            </h2>
            <p className="text-xl text-gray-600">
              Sistema a crediti, registrazione gratuita, paghi solo quello che usi
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-amber-300 shadow-xl">
              <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl">Piano Crediti</CardTitle>
                <CardDescription className="text-amber-100 text-lg">
                  Perfetto per hotel di ogni dimensione
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-gray-900 mb-2">1€</div>
                  <div className="text-xl text-gray-600">per ospite inserito</div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Registrazione hotel gratuita</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Itinerari AI illimitati per ospite</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>PDF e QR code automatici</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Email automatiche</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Supporto 24/7</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Pagamento bonifico bancario</span>
                  </div>
                </div>

                <Link href="/hotel-register">
                  <Button className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-lg py-6">
                    Prova Gratis Ora per 5 itinerari gratuiti
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-700 to-amber-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto a trasformare il tuo hotel?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Unisciti a centinaia di hotel italiani che stanno già offrendo esperienze straordinarie ai loro ospiti.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hotel-register">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50 text-lg px-8">
                Registrazione Gratuita
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-700 text-lg px-8 bg-transparent">
              Prenota Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">Landeo</span>
                  <span className="text-xs text-gray-400 font-medium italic">
                    Itinerari su misura, emozioni autentiche
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                La piattaforma AI per l'hospitality italiana. Made with ❤️ in Italy.
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
    </div>
  );
}