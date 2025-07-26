
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Heart, Users, Sparkles, Star, CheckCircle, Globe, Camera, Clock, Shield } from 'lucide-react';

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Itinerari Personalizzati AI",
      description: "Algoritmi avanzati creano percorsi unici basati sui gusti e preferenze di ogni ospite",
      color: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Esperienze Locali Autentiche",
      description: "Scopri gemme nascoste e tradizioni locali che solo i residenti conoscono davvero",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Curato con Passione",
      description: "Ogni raccomandazione è selezionata a mano da esperti locali appassionati del territorio",
      color: "bg-gradient-to-br from-red-500 to-orange-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Per Ogni Tipo di Viaggiatore",
      description: "Famiglie, coppie, viaggiatori solitari - percorsi su misura per ogni stile di viaggio",
      color: "bg-gradient-to-br from-green-500 to-emerald-500"
    }
  ];

  const testimonials = [
    {
      name: "Marco & Elena",
      location: "Milano",
      text: "Un'esperienza incredibile! L'itinerario ci ha portato in luoghi magici che non avremmo mai scoperto da soli. Ogni giorno una nuova sorpresa.",
      rating: 5,
      avatar: "🇮🇹"
    },
    {
      name: "Sarah Johnson",
      location: "London",
      text: "The personalized recommendations were spot-on! Every restaurant, every viewpoint, every hidden gem was exactly what we were looking for.",
      rating: 5,
      avatar: "🇬🇧"
    },
    {
      name: "Familie Schmidt",
      location: "Berlin",
      text: "Perfekt für unsere Familie! Die Kinder waren begeistert und wir Erwachsenen haben so viel über die lokale Kultur gelernt.",
      rating: 5,
      avatar: "🇩🇪"
    }
  ];

  const stats = [
    { number: "50K+", label: "Itinerari Creati" },
    { number: "98%", label: "Ospiti Soddisfatti" },
    { number: "200+", label: "Città Coperte" },
    { number: "24/7", label: "Supporto Locale" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ItinerAI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Funzionalità</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">Come Funziona</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Recensioni</a>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6">
                Inizia Ora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Powered by AI
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Itinerari che
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Incantano</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Scopri l'Italia attraverso percorsi personalizzati che trasformano ogni viaggio in un'avventura indimenticabile, creata su misura per te.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg group"
                >
                  Crea il Tuo Itinerario
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 px-8 py-4 text-lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Vedi Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Il Tuo Itinerario Perfetto</h3>
                        <Badge className="bg-white/20 text-white">Day 1</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">9:00 - Colazione Autentica</div>
                            <div className="text-sm opacity-90">Caffè storico nel centro</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">11:00 - Passeggiata Panoramica</div>
                            <div className="text-sm opacity-90">Vista mozzafiato sulla città</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">13:00 - Pranzo Tipico</div>
                            <div className="text-sm opacity-90">Trattoria locale nascosta</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Personalizzato per te</span>
                        <div className="flex items-center space-x-1">
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perché Scegliere ItinerAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La combinazione perfetta tra intelligenza artificiale e conoscenza locale per creare esperienze di viaggio uniche e memorabili.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setIsHovered(`feature-${index}`)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Come Funziona
            </h2>
            <p className="text-xl text-gray-600">
              Tre semplici passaggi per il tuo viaggio perfetto
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Condividi le Tue Preferenze",
                description: "Raccontaci i tuoi interessi, il tipo di esperienza che cerchi e le tue esigenze di viaggio.",
                icon: <Heart className="w-6 h-6" />
              },
              {
                step: "02", 
                title: "L'AI Crea il Tuo Percorso",
                description: "I nostri algoritmi elaborano migliaia di dati per creare un itinerario perfetto per te.",
                icon: <Sparkles className="w-6 h-6" />
              },
              {
                step: "03",
                title: "Vivi l'Esperienza",
                description: "Segui il tuo itinerario personalizzato e scopri luoghi straordinari in modo autentico.",
                icon: <MapPin className="w-6 h-6" />
              }
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    {step.step}
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-pink-300 z-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cosa Dicono i Nostri Viaggiatori
            </h2>
            <p className="text-xl text-gray-600">
              Storie autentiche di chi ha vissuto esperienze indimenticabili
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto per la Tua Prossima Avventura?
          </h2>
          <p className="text-xl text-purple-100 mb-8 leading-relaxed">
            Unisciti a migliaia di viaggiatori che hanno già scoperto la magia di un itinerario perfettamente personalizzato.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold group"
            >
              Inizia la Tua Esperienza
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              <Globe className="w-5 h-5 mr-2" />
              Esplora le Destinazioni
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-purple-100">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              <span>Garanzia Soddisfazione</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Supporto 24/7</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              <span>Copertura Mondiale</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ItinerAI</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Creiamo esperienze di viaggio uniche attraverso l'intelligenza artificiale e la passione per l'autenticità.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Funzionalità</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Prezzi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrazioni</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carriere</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contatti</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro Assistenza</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentazione</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termini</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2024 ItinerAI. Tutti i diritti riservati.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Termini di Servizio
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
