import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  Award, 
  Heart,
  MapPin,
  Calendar,
  Lightbulb,
  Zap
} from "lucide-react";
import aiTourLogo from "../assets/aitour-logo.png";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Ospitalità Italiana",
      description: "Crediamo nell'autenticità dell'accoglienza italiana e nella sua capacità di creare ricordi indimenticabili."
    },
    {
      icon: Lightbulb,
      title: "Innovazione",
      description: "Utilizziamo le tecnologie più avanzate per semplificare la vita degli albergatori e migliorare l'esperienza ospiti."
    },
    {
      icon: Users,
      title: "Supporto Umano",
      description: "Dietro ogni AI c'è un team di persone appassionate pronte ad aiutare i nostri clienti."
    },
    {
      icon: Award,
      title: "Eccellenza",
      description: "Puntiamo all'eccellenza in ogni dettaglio, dalla tecnologia al servizio clienti."
    }
  ];

  const timeline = [
    {
      year: "2024",
      title: "Nascita di AiTour",
      description: "L'idea nasce dall'esperienza diretta nel settore dell'ospitalità italiana e dalla necessità di personalizzare l'esperienza degli ospiti."
    },
    {
      year: "2024",
      title: "Sviluppo della Piattaforma",
      description: "Mesi di sviluppo intensivo per creare una piattaforma AI intuitiva e potente, progettata specificamente per gli hotel italiani."
    },
    {
      year: "2025",
      title: "Lancio Ufficiale",
      description: "AiTour debutta sul mercato italiano con una missione chiara: rivoluzionare l'ospitalità attraverso l'intelligenza artificiale."
    },
    {
      year: "Futuro",
      title: "Espansione Europea",
      description: "Piani per espandere AiTour in tutta Europa, portando l'eccellenza dell'ospitalità italiana ovunque."
    }
  ];

  const team = [
    {
      name: "Marco Rossi",
      role: "CEO & Founder",
      description: "10 anni di esperienza nel settore dell'ospitalità e della tecnologia.",
      icon: Users
    },
    {
      name: "Sofia Bianchi",
      role: "CTO",
      description: "Esperta in AI e machine learning con background in hospitality tech.",
      icon: Zap
    },
    {
      name: "Alessandro Verdi",
      role: "Head of Product",
      description: "Designer UX/UI specializzato in piattaforme per il turismo.",
      icon: Lightbulb
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <img 
                    src={aiTourLogo} 
                    alt="AiTour" 
                    className="h-12 w-auto mb-1"
                  />
                  <p className="text-xs text-amber-700 font-medium italic">
                    Itinerari su misura, emozioni autentiche
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-amber-700">
                  Accedi
                </Button>
              </Link>
              <Link href="/hotel-register">
                <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                  Inizia Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
            Chi Siamo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            La rivoluzione dell'<br />
            <span className="text-amber-700">ospitalità italiana</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AiTour nasce dalla passione per l'ospitalità italiana e dalla visione di un futuro 
            dove la tecnologia AI amplifica l'autenticità e la personalizzazione dell'esperienza ospite.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center">
                <Target className="w-6 h-6 text-amber-700 mr-2" />
                La Nostra Missione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed mb-4">
                Rendere ogni soggiorno in Italia un'esperienza unica e memorabile attraverso 
                itinerari personalizzati che uniscono l'autenticità locale con l'innovazione tecnologica.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Crediamo che ogni ospite meriti un'esperienza su misura che rifletta i suoi interessi, 
                passioni e sogni, e che ogni albergatore debba avere gli strumenti per offrire 
                questo livello di personalizzazione senza complessità.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center">
                <MapPin className="w-6 h-6 text-amber-700 mr-2" />
                La Nostra Visione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed mb-4">
                Diventare la piattaforma di riferimento per l'ospitalità italiana, 
                trasformando ogni hotel in un gateway verso esperienze autentiche e significative.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Immaginiamo un futuro dove l'intelligenza artificiale non sostituisce il calore 
                umano dell'ospitalità italiana, ma lo potenzia, permettendo agli albergatori 
                di concentrarsi su ciò che sanno fare meglio: accogliere.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            I Nostri Valori
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-amber-100 text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-amber-700" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Il Nostro Percorso
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {timeline.map((event, index) => (
              <Card key={index} className="border-amber-100 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-amber-700 mr-2" />
                    <Badge className="bg-amber-100 text-amber-800">{event.year}</Badge>
                  </div>
                  <CardTitle className="text-lg text-gray-900">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{event.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Il Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-amber-100 text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <member.icon className="w-10 h-10 text-amber-700" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{member.name}</CardTitle>
                  <p className="text-amber-700 font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-8 mb-16 border border-amber-100">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            AiTour in Numeri
          </h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">2025</div>
              <div className="text-gray-600">Anno di Fondazione</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">100%</div>
              <div className="text-gray-600">Made in Italy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">24/7</div>
              <div className="text-gray-600">Supporto Disponibile</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">∞</div>
              <div className="text-gray-600">Possibilità Creative</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Unisciti alla Rivoluzione dell'Ospitalità
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Diventa parte della storia di AiTour e trasforma il tuo hotel in un'esperienza indimenticabile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hotel-register">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
                Inizia il Tuo Viaggio
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Contattaci
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}