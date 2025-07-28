import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  ArrowLeft,
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
  Award,
  TrendingUp,
  Target,
  Smartphone,
  Euro,
  BarChart3,
  MessageSquare,
  Calendar,
  Camera,
  MapIcon
} from "lucide-react";

export default function DiscoverMore() {
  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Aumenta la Soddisfazione Ospiti",
      description: "Il 98% degli ospiti che ricevono itinerari personalizzati lascia recensioni positive e ritorna per futuri soggiorni.",
      stats: "+35% recensioni positive"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Differenziati dalla Concorrenza",
      description: "Offri un servizio premium che pochi hotel possono eguagliare, posizionandoti come leader nell'innovazione.",
      stats: "Vantaggio competitivo"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Fidelizza la Clientela",
      description: "Gli ospiti che ricevono esperienze personalizzate hanno il 40% di probabilità in più di prenotare nuovamente.",
      stats: "+40% ritorni"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Riduci il Carico di Lavoro",
      description: "Automatizza la creazione di consigli turistici, liberando il tuo staff per attività a maggior valore aggiunto.",
      stats: "-60% tempo gestione"
    }
  ];

  const features = [
    {
      category: "Intelligenza Artificiale",
      items: [
        "Algoritmi GPT-4 per raccomandazioni ultra-personalizzate",
        "Analisi automatica delle preferenze ospiti",
        "Ottimizzazione percorsi e tempistiche",
        "Suggerimenti basati su stagionalità e meteo"
      ]
    },
    {
      category: "Gestione Ospiti",
      items: [
        "Database completo profili ospiti",
        "Form personalizzabili per raccolta preferenze",
        "Storico soggiorni e preferenze",
        "Segmentazione automatica clientela"
      ]
    },
    {
      category: "Branding & Personalizzazione",
      items: [
        "PDF con logo e colori del tuo hotel",
        "Messaggi di benvenuto personalizzati",
        "Integrazione completa brand identity",
        "Template personalizzabili per ogni stagione"
      ]
    },
    {
      category: "Distribuzione Contenuti",
      items: [
        "QR code per accesso mobile immediato",
        "Email automatiche con PDF allegato",
        "Link condivisibili per famiglie",
        "Versioni multilingua automatiche"
      ]
    }
  ];

  const roi = [
    {
      metric: "Tempo Risparmiato",
      value: "15 ore/settimana",
      description: "Il tuo staff non deve più creare manualmente consigli turistici"
    },
    {
      metric: "Incremento Revenue",
      value: "€2.500/mese",
      description: "Grazie a maggiori prenotazioni dirette e soggiorni prolungati"
    },
    {
      metric: "Costo per Ospite",
      value: "€1",
      description: "Investimento minimo per un servizio che vale centinaia di euro"
    },
    {
      metric: "Payback Period",
      value: "2 settimane",
      description: "Il ritorno sull'investimento è immediato e misurabile"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-warmgray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-amber-800 rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-800 bg-clip-text text-transparent">
                  AiTour
                </h1>
                <p className="text-sm text-gray-600">AI per l'Ospitalità Italiana</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Torna alla Home
                </Button>
              </Link>
              <Link href="/hotel-register">
                <Button className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900">
                  Registrati Ora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-6">
            🚀 Scopri di Più
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Perché gli Hotel di Successo
            <span className="block bg-gradient-to-r from-amber-700 to-amber-800 bg-clip-text text-transparent">
              Scelgono AiTour
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Non è solo tecnologia, è una strategia vincente per trasformare ogni ospite in un ambassador del tuo hotel. 
            Scopri come funziona e perché dovresti iniziare oggi stesso.
          </p>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 border-green-300 mb-4">
              💰 Ritorno sull'Investimento
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              I Numeri Parlano Chiaro
            </h2>
            <p className="text-xl text-gray-600">
              Investimento minimo, risultati massimi: ecco cosa puoi aspettarti
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roi.map((item, index) => (
              <Card key={index} className="text-center border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">{item.value}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.metric}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              🎯 Vantaggi Concreti
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trasforma il Tuo Business
            </h2>
            <p className="text-xl text-gray-600">
              Ogni funzionalità è progettata per generare risultati misurabili
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-amber-200">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-600 mb-4">{benefit.description}</p>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {benefit.stats}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 mb-4">
              ⚙️ Funzionalità Complete
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tutto Quello che Ti Serve
            </h2>
            <p className="text-xl text-gray-600">
              Una piattaforma completa per ogni aspetto della gestione ospiti
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900">{feature.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 mb-4">
              🔄 Processo Semplificato
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Come Iniziare in 3 Passi
            </h2>
            <p className="text-xl text-gray-600">
              Setup rapido, risultati immediati
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Registrazione</h3>
              <p className="text-gray-600">
                Crea il tuo account, configura il profilo hotel e carica il tuo logo. 
                Tutto gratuito, nessun costo iniziale.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Setup Esperienze</h3>
              <p className="text-gray-600">
                Aggiungi le attrazioni locali, ristoranti e attività che conosci meglio. 
                Il tuo know-how locale è il valore aggiunto.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Primi Ospiti</h3>
              <p className="text-gray-600">
                Acquista crediti (1€ per ospite) e inizia a creare itinerari personalizzati. 
                Vedrai i risultati dal primo giorno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              📊 Caso di Studio
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Hotel Bellavista, Roma
            </h2>
            <p className="text-xl text-blue-100">
              Come hanno aumentato la soddisfazione ospiti del 40% in 3 mesi
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Prima di Landeo</h3>
                <ul className="space-y-2 text-blue-100">
                  <li>• Staff sovraccarico di richieste informazioni</li>
                  <li>• Consigli generici e non personalizzati</li>
                  <li>• Ospiti insoddisfatti delle raccomandazioni</li>
                  <li>• Recensioni online sotto la media</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Dopo 3 mesi con Landeo</h3>
                <ul className="space-y-2 text-green-200">
                  <li>• +40% soddisfazione ospiti</li>
                  <li>• +25% recensioni positive</li>
                  <li>• -60% tempo staff per consigli turistici</li>
                  <li>• +30% prenotazioni dirette repeat</li>
                </ul>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block bg-white/20 rounded-2xl p-8">
                <BarChart3 className="w-24 h-24 mx-auto mb-6" />
                <div className="text-4xl font-bold mb-2">€8.500</div>
                <div className="text-lg text-blue-100">Revenue aggiuntivo mensile</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-4">
              ❓ Domande Frequenti
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tutto quello che vuoi sapere
            </h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quanto costa realmente utilizzare AiTour?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Solo 1€ per ogni ospite che inserisci nel sistema. La registrazione del tuo hotel è completamente gratuita, 
                  così come la configurazione iniziale. Non ci sono costi fissi mensili o commissioni nascoste.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quanto tempo serve per vedere i primi risultati?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  I primi itinerari possono essere generati immediatamente dopo il setup. La maggior parte degli hotel 
                  vede un miglioramento nelle recensioni entro le prime 2 settimane e un incremento significativo 
                  delle prenotazioni repeat entro il primo mese.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>È difficile da usare per il mio staff?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Assolutamente no. L'interfaccia è progettata per essere intuitiva. La maggior parte degli utenti 
                  padroneggia il sistema in meno di 30 minuti. Inoltre, forniamo supporto completo durante l'onboarding.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cosa succede se un ospite non è soddisfatto dell'itinerario?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gli itinerari possono essere modificati in tempo reale dal tuo staff. Inoltre, l'AI impara dalle 
                  preferenze e feedback, migliorando costantemente la qualità delle raccomandazioni.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-amber-700 to-amber-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto a Trasformare l'Esperienza dei Tuoi Ospiti?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Unisciti a oltre 500 hotel che hanno già scelto Landeo per distinguersi dalla concorrenza
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hotel-register">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-gray-100 px-8 py-4 text-lg">
                Inizia Subito - Gratis
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Torna alla Home
              </Button>
            </Link>
          </div>
          <p className="text-sm text-amber-200 mt-4">
            Setup gratuito • Nessun contratto • Supporto incluso
          </p>
        </div>
      </section>
    </div>
  );
}