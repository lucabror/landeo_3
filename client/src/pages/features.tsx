import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Sparkles, 
  Users, 
  MapPin, 
  QrCode, 
  Mail, 
  FileText, 
  BarChart3,
  Shield,
  Zap,
  Globe,
  Smartphone,
  CheckCircle
} from "lucide-react";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import Footer from "@/components/footer";

export default function Features() {
  const features = [
    {
      icon: Bot,
      title: "Intelligenza Artificiale Avanzata",
      description: "AI OpenAI per generare itinerari personalizzati basati sulle preferenze degli ospiti",
      benefits: ["Itinerari unici per ogni ospite", "Raccomandazioni intelligenti", "Esperienza personalizzata"]
    },
    {
      icon: Users,
      title: "Gestione Profili Ospiti",
      description: "Sistema completo per gestire preferenze, durata soggiorno e informazioni ospiti",
      benefits: ["Database ospiti centralizzato", "Preferenze salvate", "Storico soggiorni"]
    },
    {
      icon: MapPin,
      title: "Esperienze Locali",
      description: "Catalogo personalizzabile di attrazioni, ristoranti e attività nella vostra zona",
      benefits: ["Contenuti locali autentici", "Facilità di gestione", "Aggiornamenti in tempo reale"]
    },
    {
      icon: QrCode,
      title: "PDF e QR Code",
      description: "Generazione automatica di PDF eleganti e QR code per accesso facile degli ospiti",
      benefits: ["Design professionale", "Accesso immediato", "Condivisione semplice"]
    },
    {
      icon: Mail,
      title: "Email Automatiche",
      description: "Sistema di invio email per raccogliere preferenze e inviare itinerari",
      benefits: ["Comunicazione automatizzata", "Template professionali", "Gestione completa"]
    },
    {
      icon: Smartphone,
      title: "Esperienza Mobile",
      description: "Interfaccia ottimizzata per smartphone per una perfetta esperienza ospiti",
      benefits: ["Design responsive", "Usabilità mobile", "Accesso ovunque"]
    },
    {
      icon: BarChart3,
      title: "Analytics e Statistiche",
      description: "Dashboard completa con metriche su utilizzo crediti e performance",
      benefits: ["Monitoraggio in tempo reale", "Report dettagliati", "Insights utili"]
    },
    {
      icon: Shield,
      title: "Sicurezza Avanzata",
      description: "Autenticazione 2FA, crittografia dati e protezione completa informazioni",
      benefits: ["Google Authenticator", "Dati protetti", "Accesso sicuro"]
    }
  ];

  const integrations = [
    { name: "OpenAI GPT", description: "Intelligenza artificiale per generazione itinerari" },
    { name: "Resend", description: "Sistema email professionale" },
    { name: "PostgreSQL", description: "Database sicuro e affidabile" },
    { name: "Google Authenticator", description: "Autenticazione a due fattori" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div>
                  <img 
                    src={landeoLogo} 
                    alt="Landeo" 
                    className="h-12 w-auto block"
                  />
                  <p className="text-amber-700 tracking-wide whitespace-nowrap text-[17px] font-light">
                    Itinerari su misura
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
            Funzionalità Complete
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tutto quello che serve per<br />
            <span className="text-amber-700">trasformare l'ospitalità</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Landeo offre una suite completa di strumenti AI-powered per creare esperienze 
            uniche per i vostri ospiti e ottimizzare la gestione del vostro hotel.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-amber-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-700" />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-2xl p-8 mb-16 border border-amber-100">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Tecnologie di Ultima Generazione
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Pronto a Trasformare la Tua Ospitalità?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Inizia gratis con 5 itinerari inclusi. Nessun costo nascosto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hotel-register">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
                Inizia Gratis Ora
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Vedi Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}