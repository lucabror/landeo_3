import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Scale, 
  CreditCard, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Mail
} from "lucide-react";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import Footer from "@/components/footer";

export default function Terms() {
  const sections = [
    {
      title: "Accettazione dei Termini",
      icon: CheckCircle,
      content: "Utilizzando Landeo, accetti integralmente questi Termini e Condizioni. Se non accetti questi termini, non utilizzare il servizio. L'uso continuato della piattaforma costituisce accettazione di eventuali modifiche ai termini."
    },
    {
      title: "Descrizione del Servizio",
      icon: FileText,
      content: "Landeo è una piattaforma SaaS che permette agli hotel di creare itinerari personalizzati per i propri ospiti utilizzando intelligenza artificiale. Il servizio include gestione profili ospiti, generazione di itinerari AI, creazione di PDF e QR code, e sistema di email automatiche."
    },
    {
      title: "Account Utente",
      icon: Shield,
      content: "Per utilizzare Landeo devi creare un account fornendo informazioni accurate e complete. Sei responsabile della sicurezza del tuo account e password. Devi notificarci immediatamente qualsiasi accesso non autorizzato al tuo account."
    },
    {
      title: "Pagamenti e Fatturazione",
      icon: CreditCard,
      content: "Landeo opera con un sistema a crediti. Ogni itinerario generato costa 1 credito (1€). I pagamenti avvengono tramite bonifico bancario. I crediti non scadono e non sono rimborsabili una volta acquistati, salvo quanto previsto dalla legge."
    },
    {
      title: "Uso Accettabile",
      icon: Scale,
      content: "Ti impegni a utilizzare Landeo solo per scopi legali e in conformità con questi termini. È vietato: usare il servizio per attività illegali, tentare di violare la sicurezza del sistema, utilizzare il servizio per spam o attività dannose."
    },
    {
      title: "Proprietà Intellettuale",
      icon: AlertCircle,
      content: "Landeo e tutti i suoi contenuti sono protetti da copyright e altri diritti di proprietà intellettuale. Ti concediamo una licenza limitata, non esclusiva e revocabile per utilizzare il servizio secondo questi termini."
    }
  ];

  const limitations = [
    "Disponibilità del Servizio: ci impegniamo a mantenere il servizio disponibile 99.5% del tempo, escluse manutenzioni programmate",
    "Limiti di Responsabilità: la nostra responsabilità è limitata all'importo pagato negli ultimi 12 mesi",
    "Forza Maggiore: non siamo responsabili per interruzioni dovute a cause al di fuori del nostro controllo",
    "Dati Utente: non garantiamo l'accuratezza dei contenuti generati dall'AI, che devono essere sempre verificati"
  ];

  const userObligations = [
    "Fornire informazioni accurate durante la registrazione",
    "Mantenere la sicurezza delle credenziali di accesso",
    "Utilizzare il servizio solo per scopi legali e legittimi",
    "Rispettare i diritti di proprietà intellettuale",
    "Non tentare di violare la sicurezza del sistema",
    "Notificare immediatamente violazioni di sicurezza"
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
                  <div className="w-full h-px bg-gray-200 my-2"></div>
                  <p className="text-xs text-amber-700 font-medium tracking-wide whitespace-nowrap">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
            Termini e Condizioni
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Termini e Condizioni<br />
            <span className="text-amber-700">di Landeo</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Questi termini regolano l'uso della piattaforma Landeo. 
            Ti preghiamo di leggerli attentamente prima di utilizzare il nostro servizio.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <p className="text-sm text-amber-800">
              <strong>Ultimo aggiornamento:</strong> 27 Gennaio 2025<br />
              <strong>Entrata in vigore:</strong> 27 Gennaio 2025<br />
              <strong>Legge applicabile:</strong> Legge italiana
            </p>
          </div>
        </div>

        {/* Main Sections */}
        <div className="space-y-8 mb-16">
          {sections.map((section, index) => (
            <Card key={index} className="border-amber-100">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <section.icon className="w-6 h-6 text-amber-700 mr-3" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Obligations */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <CheckCircle className="w-6 h-6 text-amber-700 mr-3" />
              Obblighi dell'Utente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Utilizzando Landeo, ti impegni a rispettare i seguenti obblighi:
            </p>
            <div className="space-y-3">
              {userObligations.map((obligation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-amber-700 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{obligation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Limitations */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <AlertCircle className="w-6 h-6 text-amber-700 mr-3" />
              Limitazioni e Esclusioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {limitations.map((limitation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{limitation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Risoluzione del Contratto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Risoluzione da parte dell'Utente</h4>
                <p className="text-gray-600">Puoi cessare l'utilizzo di Landeo in qualsiasi momento. I crediti residui rimarranno disponibili secondo i termini di servizio.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Risoluzione da parte di Landeo</h4>
                <p className="text-gray-600">Possiamo sospendere o terminare il tuo account in caso di violazione di questi termini o per motivi di sicurezza.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Effetti della Risoluzione</h4>
                <p className="text-gray-600">Alla risoluzione, l'accesso al servizio cesserà immediatamente. I dati potranno essere conservati secondo la Privacy Policy.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Scale className="w-6 h-6 text-amber-700 mr-3" />
              Informazioni Legali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Legge Applicabile</h4>
                <p className="text-gray-600">Questi termini sono regolati dalla legge italiana. Eventuali controversie saranno risolte presso i tribunali competenti di Milano.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Modifiche ai Termini</h4>
                <p className="text-gray-600">Ci riserviamo il diritto di modificare questi termini. Le modifiche significative saranno comunicate con 30 giorni di preavviso.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Separabilità</h4>
                <p className="text-gray-600">Se una parte di questi termini è invalida, il resto rimane in vigore.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Mail className="w-6 h-6 text-amber-700 mr-3" />
              Informazioni Societarie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Ragione sociale:</strong> Landeo S.r.l.</p>
              <p className="text-gray-700"><strong>Sede legale:</strong> Via dell'Innovazione 123, 20100 Milano, Italia</p>
              <p className="text-gray-700"><strong>Partita IVA:</strong> IT12345678901</p>
              <p className="text-gray-700"><strong>Codice Fiscale:</strong> 12345678901</p>
              <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:legal@landeo.it" className="text-amber-700 hover:text-amber-800">legal@landeo.it</a></p>
              <p className="text-gray-700"><strong>PEC:</strong> landeo@pec.it</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white mt-16">
          <h2 className="text-3xl font-bold mb-4">
            Hai Domande sui Termini?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Il nostro team legale è disponibile per chiarimenti sui termini di servizio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
              <Mail className="mr-2 h-5 w-5" />
              Contatta Team Legale
            </Button>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Centro Assistenza
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}