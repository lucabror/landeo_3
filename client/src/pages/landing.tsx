import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-stone-50/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">
                  ItineraItalia
                </h1>
                <p className="text-xs text-orange-600">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-100">
                  Accedi
                </Button>
              </Link>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Demo Gratuita
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-100/50 to-orange-100/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-6">
                Powered by AI & Made in Italy
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6 leading-tight">
                Esperienze Italiane
                <span className="text-orange-500 block">
                  su Misura
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-stone-600 mb-8 leading-relaxed">
                La piattaforma AI che trasforma ogni soggiorno in un'esperienza indimenticabile, 
                creando itinerari personalizzati per gli ospiti dei tuoi hotel e resort.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/login">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 w-full sm:w-auto">
                    Inizia la Demo Gratuita
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50 text-lg px-8 w-full sm:w-auto">
                  Scopri di Più
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-8">
                <div className="text-center lg:text-left">
                  <div className="text-2xl lg:text-3xl font-bold text-stone-900">500+</div>
                  <div className="text-sm text-stone-600">Hotel Partner</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl lg:text-3xl font-bold text-stone-900">50K+</div>
                  <div className="text-sm text-stone-600">Itinerari Creati</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl lg:text-3xl font-bold text-stone-900">95%</div>
                  <div className="text-sm text-stone-600">Soddisfazione Ospiti</div>
                </div>
              </div>
            </div>
            
            {/* iPhone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* iPhone Frame */}
                <div className="w-72 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                    {/* iPhone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                    
                    {/* App Content */}
                    <div className="pt-8 px-4 h-full bg-gradient-to-b from-stone-50 to-orange-50">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold text-stone-900 mb-2">Vedi la magia in azione</h3>
                        <p className="text-sm text-stone-600">Itinerario personalizzato per una famiglia</p>
                      </div>
                      
                      {/* Guest Profile Card */}
                      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-stone-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900">Profilo Ospite</div>
                            <div className="text-xs text-stone-600">Generato dall'hotel manager</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-stone-500" />
                            <span className="text-stone-700">Famiglia con bambini</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-stone-500" />
                            <span className="text-stone-700">3 giorni di soggiorno</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-stone-500" />
                            <span className="text-stone-700">Hotel Villa Tuscany, Castellina</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Day 1 */}
                      <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-stone-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                          <div>
                            <div className="font-semibold text-stone-900">Scoperta del Chianti</div>
                            <div className="text-xs text-stone-600">09:00 - 18:00</div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-auto">Famiglia-friendly</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-stone-600">
                          <div>• Visita guidata Castello di Brolio</div>
                          <div>• Degustazione vini per adulti</div>
                          <div>• Laboratorio ceramica per bambini</div>
                        </div>
                      </div>
                      
                      {/* Day 2 */}
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                          <div>
                            <div className="font-semibold text-stone-900">Avventura Naturale</div>
                            <div className="text-xs text-stone-600">08:30 - 17:30</div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 text-xs ml-auto">All'aria aperta</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-stone-600">
                          <div>• Trekking nelle colline</div>
                          <div>• Picnic panoramico</div>
                          <div>• Visita fattoria didattica</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-4">
              Funzionalità Complete
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
              Tutto quello che serve per l'ospitalità perfetta
            </h2>
            <p className="text-lg lg:text-xl text-stone-600 max-w-3xl mx-auto">
              Una piattaforma completa che integra AI, design elegante e funzionalità avanzate per trasformare ogni soggiorno in un'esperienza indimenticabile.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-orange-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl text-stone-900">AI Itinerari Personalizzati</CardTitle>
                <CardDescription className="text-stone-600">
                  Algoritmi AI avanzati che creano itinerari personalizzati basati sui profili degli ospiti.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-orange-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl text-stone-900">Profili Ospiti</CardTitle>
                <CardDescription className="text-stone-600">
                  Creazione dettagliata di profili personalizzati: famiglie, coppie, business, senior travelers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-orange-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl text-stone-900">Esperienze Locali</CardTitle>
                <CardDescription className="text-stone-600">
                  Database completo delle attività e attrazioni nei dintorni dell'hotel con partnership.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-orange-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl text-stone-900">QR Code & PDF</CardTitle>
                <CardDescription className="text-stone-600">
                  Tagliandini eleganti con QR code e PDF completi per un'esperienza premium.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-orange-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl text-stone-900">Email Automatiche</CardTitle>
                <CardDescription className="text-stone-600">
                  Sistema di invio email automatico per PDF itinerari e comunicazioni personalizzate.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-orange-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl text-stone-900">Dashboard Completa</CardTitle>
                <CardDescription className="text-stone-600">
                  Dashboard completa per la gestione dei dati dell'hotel, localizzazione e servizi offerti.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 lg:py-20 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-4">
              Demo Interattiva
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
              Vedi la magia in azione
            </h2>
            <p className="text-lg lg:text-xl text-stone-600 max-w-3xl mx-auto">
              Ecco come l'AI genera un itinerario personalizzato per una famiglia che soggiorna in un hotel del Chianti Classico.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Step 1 */}
                <div className="text-center lg:text-left">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto lg:mx-0 mb-4">1</div>
                  <h3 className="font-semibold text-stone-900 mb-2">Profilo Ospite</h3>
                  <p className="text-sm text-stone-600 mb-4">Generato dall'hotel manager</p>
                  <div className="space-y-2 text-sm text-stone-600">
                    <div>👨‍👩‍👧‍👦 Famiglia con bambini</div>
                    <div>📅 3 giorni di soggiorno</div>
                    <div>🏨 Hotel Villa Tuscany, Castellina</div>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="text-center lg:text-left">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto lg:mx-0 mb-4">2</div>
                  <h3 className="font-semibold text-stone-900 mb-2">Scoperta del Chianti</h3>
                  <p className="text-sm text-stone-600 mb-4">09:00 - 18:00</p>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs mb-3">Esperienza famiglia-friendly</Badge>
                  <div className="space-y-1 text-sm text-stone-600">
                    <div>• Visita guidata Castello di Brolio</div>
                    <div>• Degustazione vini per adulti</div>
                    <div>• Laboratorio ceramica per bambini</div>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="text-center lg:text-left">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto lg:mx-0 mb-4">3</div>
                  <h3 className="font-semibold text-stone-900 mb-2">Avventura Naturale</h3>
                  <p className="text-sm text-stone-600 mb-4">08:30 - 17:30</p>
                  <Badge className="bg-green-100 text-green-800 text-xs mb-3">Attività all'aria aperta</Badge>
                  <div className="space-y-1 text-sm text-stone-600">
                    <div>• Trekking dolce nelle colline</div>
                    <div>• Picnic panoramico</div>
                    <div>• Visita fattoria didattica</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              🔄 Come Funziona
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Semplice come 1, 2, 3
            </h2>
            <p className="text-xl text-gray-600">
              Inizia in pochi minuti e trasforma subito l'esperienza dei tuoi ospiti
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
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
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
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

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              💬 Testimonianze
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cosa dicono i nostri partner
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "ItineraItalia ha rivoluzionato il modo in cui gestiamo gli ospiti. Gli itinerari AI sono incredibilmente accurati e i nostri clienti sono entusiasti!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">Marco Rossi</p>
                    <p className="text-sm text-gray-600">Hotel Bellavista, Roma</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "Il sistema di crediti è perfetto per la nostra struttura. Paghiamo solo per quello che usiamo e il ROI è immediato."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    G
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">Giulia Bianchi</p>
                    <p className="text-sm text-gray-600">Resort Mediterraneo, Amalfi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "Setup rapido, interfaccia intuitiva e risultati straordinari. I nostri ospiti ricevono esperienze su misura."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">Andrea Conti</p>
                    <p className="text-sm text-gray-600">Boutique Hotel Toscana</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              💰 Prezzi Trasparenti
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Solo 1€ per ospite
            </h2>
            <p className="text-xl text-gray-600">
              Sistema a crediti, registrazione gratuita, paghi solo quello che usi
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-orange-300 shadow-xl">
              <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl lg:text-3xl">Piano Crediti</CardTitle>
                <CardDescription className="text-orange-100 text-base lg:text-lg">
                  Perfetto per hotel di ogni dimensione
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl lg:text-6xl font-bold text-stone-900 mb-2">1€</div>
                  <div className="text-lg lg:text-xl text-stone-600">per ospite inserito</div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-stone-700">Registrazione hotel gratuita</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-stone-700">Itinerari AI illimitati per ospite</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-stone-700">PDF e QR code automatici</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-stone-700">Email automatiche</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-stone-700">Supporto 24/7</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-stone-700">Pagamento bonifico bancario</span>
                  </div>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6">
                    Inizia Gratis Ora
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pronto a creare esperienze uniche?
          </h2>
          <p className="text-lg lg:text-xl text-orange-100 mb-8">
            Inizia oggi stesso con la demo gratuita e scopri come l'AI può trasformare l'esperienza dei tuoi ospiti.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-stone-50 text-lg px-8">
                Inizia la Demo Gratuita
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ItineraItalia</span>
              </div>
              <p className="text-stone-400 text-sm">
                La piattaforma AI per l'hospitality italiana. Made with ❤️ in Italy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Prodotto</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Funzionalità</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Prezzi</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Demo</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Supporto</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Centro Assistenza</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Documentazione</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Contatti</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Azienda</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Chi Siamo</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Privacy</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Termini</li>
                <li className="hover:text-orange-400 cursor-pointer transition-colors">Sicurezza</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 mt-8 pt-8 text-center text-sm text-stone-400">
            <p>&copy; 2025 ItineraItalia. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}