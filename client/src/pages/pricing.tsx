import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Zap, Crown, Building } from "lucide-react";
import aiTourLogo from "../assets/aitour-logo.png";

export default function Pricing() {
  const pricingPlans = [
    {
      name: "Prova Gratuita",
      price: "0€",
      period: "5 itinerari inclusi",
      description: "Perfetto per testare la piattaforma",
      icon: Zap,
      color: "border-gray-200",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      features: [
        "5 itinerari AI gratuiti",
        "Gestione profili ospiti",
        "Esperienze locali base",
        "PDF e QR code",
        "Email automatiche",
        "Supporto email"
      ],
      limitations: [
        "Limitato a 5 itinerari",
        "Nessun supporto prioritario",
        "Funzionalità base"
      ]
    },
    {
      name: "Pay-per-Use",
      price: "1€",
      period: "per itinerario generato",
      description: "Paga solo quello che usi",
      icon: Building,
      color: "border-amber-300",
      buttonColor: "bg-amber-700 hover:bg-amber-800",
      popular: true,
      features: [
        "Itinerari AI illimitati",
        "Dashboard completa",
        "Gestione avanzata ospiti",
        "Catalogo esperienze completo",
        "PDF eleganti e QR code",
        "Sistema email automatico",
        "Analytics e statistiche",
        "Supporto prioritario",
        "Backup automatico",
        "Sicurezza avanzata"
      ],
      limitations: []
    },
    {
      name: "Pacchetti Prepagati",
      price: "da 18€",
      period: "pacchetti convenienti",
      description: "Risparmia con i pacchetti crediti",
      icon: Crown,
      color: "border-purple-300",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      features: [
        "Tutti i vantaggi Pay-per-Use",
        "Sconto sul prezzo unitario",
        "Crediti mai in scadenza",
        "Supporto telefonico",
        "Onboarding personalizzato",
        "Consulenza strategica",
        "Report mensili dettagliati",
        "Backup prioritario"
      ],
      packages: [
        { credits: 20, price: "18€", savings: "2€" },
        { credits: 45, price: "40€", savings: "5€" },
        { credits: 92, price: "80€", savings: "12€" },
        { credits: 150, price: "120€", savings: "30€" }
      ]
    }
  ];

  const benefits = [
    "✅ Nessun costo di setup o canone mensile",
    "✅ Scalabilità completa per ogni dimensione hotel",
    "✅ Supporto tecnico specializzato in italiano",
    "✅ Aggiornamenti automatici e gratuiti",
    "✅ Sicurezza di livello enterprise",
    "✅ Integrazione rapida in 24 ore"
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
            Prezzi Trasparenti
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Semplice, Trasparente,<br />
            <span className="text-amber-700">Solo quello che usi</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Nessun canone fisso. Nessun costo nascosto. Paga solo per gli itinerari che generi 
            e migliora subito l'esperienza dei tuoi ospiti.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-amber-300 scale-105' : ''} hover:shadow-lg transition-all`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-amber-700 text-white">Più Popolare</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
                  <plan.icon className="w-8 h-8 text-amber-700" />
                </div>
                <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations && plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <X className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>

                {plan.packages && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Pacchetti Disponibili:</h4>
                    <div className="space-y-2">
                      {plan.packages.map((pkg, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                          <span className="text-sm font-medium">{pkg.credits} crediti</span>
                          <div className="text-right">
                            <span className="text-sm font-bold">{pkg.price}</span>
                            <span className="text-xs text-green-600 ml-2">Risparmi {pkg.savings}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link href={index === 0 ? "/hotel-register" : "/hotel-register"}>
                  <Button className={`w-full ${plan.buttonColor} text-white`}>
                    {index === 0 ? "Inizia Gratis" : "Inizia Ora"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl p-8 mb-16 border border-amber-100">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Perché Scegliere AiTour?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-lg text-gray-700">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                <span>{benefit.slice(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Quick */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Domande Frequenti</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">I crediti scadono?</h3>
                <p className="text-gray-600">No, i crediti acquistati non hanno scadenza. Puoi utilizzarli quando vuoi.</p>
              </CardContent>
            </Card>
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Posso cambiare piano?</h3>
                <p className="text-gray-600">Sì, puoi sempre acquistare crediti aggiuntivi o cambiare modalità di pagamento.</p>
              </CardContent>
            </Card>
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">C'è supporto incluso?</h3>
                <p className="text-gray-600">Tutti i piani includono supporto email. I pacchetti prepagati includono anche supporto telefonico.</p>
              </CardContent>
            </Card>
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Come funziona il pagamento?</h3>
                <p className="text-gray-600">Pagamenti sicuri tramite bonifico bancario. Riceverai i crediti entro 24 ore dalla conferma.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Inizia Subito con 5 Itinerari Gratuiti
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Nessuna carta di credito richiesta. Setup completato in 5 minuti.
          </p>
          <Link href="/hotel-register">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
              Prova Gratis Ora
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}