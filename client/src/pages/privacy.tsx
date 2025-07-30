import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, FileText, Mail } from "lucide-react";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import Footer from "@/components/footer";

export default function Privacy() {
  const sections = [
    {
      title: "Informazioni che Raccogliamo",
      icon: FileText,
      content: [
        {
          subtitle: "Informazioni dell'Hotel",
          text: "Nome dell'hotel, indirizzo, contatti, credenziali di accesso e informazioni di fatturazione necessarie per fornire il servizio."
        },
        {
          subtitle: "Dati degli Ospiti",
          text: "Nome, email, preferenze di viaggio e dettagli del soggiorno forniti volontariamente per la creazione di itinerari personalizzati."
        },
        {
          subtitle: "Dati di Utilizzo",
          text: "Informazioni su come utilizzi la piattaforma Landeo, inclusi log di accesso, funzionalità utilizzate e statistiche aggregate."
        }
      ]
    },
    {
      title: "Come Utilizziamo i Tuoi Dati",
      icon: Eye,
      content: [
        {
          subtitle: "Fornitura del Servizio",
          text: "Per generare itinerari personalizzati, gestire il tuo account e fornire supporto tecnico."
        },
        {
          subtitle: "Miglioramento del Servizio",
          text: "Per analizzare l'utilizzo della piattaforma e migliorare le funzionalità AI e l'esperienza utente."
        },
        {
          subtitle: "Comunicazioni",
          text: "Per inviarti aggiornamenti sul servizio, supporto tecnico e informazioni importanti sul tuo account."
        }
      ]
    },
    {
      title: "Protezione dei Dati",
      icon: Shield,
      content: [
        {
          subtitle: "Crittografia",
          text: "Tutti i dati sono protetti con crittografia avanzata sia durante la trasmissione che nell'archiviazione."
        },
        {
          subtitle: "Accesso Limitato",
          text: "Solo il personale autorizzato ha accesso ai tuoi dati, e solo quando necessario per fornire il servizio."
        },
        {
          subtitle: "Sicurezza Infrastrutturale",
          text: "Utilizziamo provider cloud certificati SOC 2 Type II e ISO 27001 per garantire la massima sicurezza."
        }
      ]
    },
    {
      title: "Condivisione con Terze Parti",
      icon: Lock,
      content: [
        {
          subtitle: "Fornitori di Servizi",
          text: "Condividiamo dati limitati con fornitori di servizi essenziali (hosting, email, pagamenti) sotto stretti accordi di riservatezza."
        },
        {
          subtitle: "Conformità Legale",
          text: "Possiamo divulgare informazioni quando richiesto per legge o per proteggere i diritti di Landeo o degli utenti."
        },
        {
          subtitle: "Mai Vendita",
          text: "Non vendiamo mai i tuoi dati personali a terze parti per scopi commerciali o pubblicitari."
        }
      ]
    }
  ];

  const rights = [
    "Accesso: Richiedere una copia dei tuoi dati personali",
    "Rettifica: Correggere dati inesatti o incompleti",
    "Cancellazione: Richiedere la cancellazione dei tuoi dati",
    "Portabilità: Ricevere i tuoi dati in formato strutturato",
    "Limitazione: Limitare il trattamento dei tuoi dati",
    "Opposizione: Opporti al trattamento per motivi legittimi"
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
            Privacy Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            La tua privacy è<br />
            <span className="text-amber-700">la nostra priorità</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Landeo si impegna a proteggere la tua privacy e i tuoi dati personali. 
            Questa policy spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <p className="text-sm text-amber-800">
              <strong>Ultimo aggiornamento:</strong> 27 Gennaio 2025<br />
              <strong>Entrata in vigore:</strong> 27 Gennaio 2025<br />
              <strong>Normativa di riferimento:</strong> GDPR (UE) 2016/679
            </p>
          </div>
        </div>

        {/* Main Content */}
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
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h4 className="font-semibold text-gray-900 mb-2">{item.subtitle}</h4>
                      <p className="text-gray-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rights Section */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Shield className="w-6 h-6 text-amber-700 mr-3" />
              I Tuoi Diritti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              In conformità al GDPR, hai i seguenti diritti riguardo ai tuoi dati personali:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {rights.map((right, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-amber-700 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{right}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Come esercitare i tuoi diritti:</strong> Contatta il nostro Data Protection Officer 
                all'indirizzo <a href="mailto:privacy@landeo.it" className="text-amber-700 hover:text-amber-800">privacy@landeo.it</a> 
                o utilizza il modulo di contatto sul nostro sito.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookies Section */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Cookie e Tecnologie Simili</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cookie Essenziali</h4>
                <p className="text-gray-600">Necessari per il funzionamento della piattaforma e la sicurezza dell'account.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cookie Analitici</h4>
                <p className="text-gray-600">Ci aiutano a comprendere come utilizzi la piattaforma per migliorare l'esperienza.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Gestione Cookie</h4>
                <p className="text-gray-600">Puoi gestire le tue preferenze sui cookie nelle impostazioni del tuo browser.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="border-amber-100 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Conservazione dei Dati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Dati dell'Account</h4>
                <p className="text-gray-600">Conservati per tutta la durata del servizio e fino a 12 mesi dopo la cancellazione dell'account.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Dati degli Ospiti</h4>
                <p className="text-gray-600">Conservati solo per il tempo necessario alla fornitura del servizio, generalmente non oltre 24 mesi.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Dati di Fatturazione</h4>
                <p className="text-gray-600">Conservati per 10 anni in conformità alle normative fiscali italiane.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Mail className="w-6 h-6 text-amber-700 mr-3" />
              Contatti Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h4>
                <p className="text-gray-600">Email: <a href="mailto:privacy@landeo.it" className="text-amber-700 hover:text-amber-800">privacy@landeo.it</a></p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Titolare del Trattamento</h4>
                <p className="text-gray-600">
                  Landeo S.r.l.<br />
                  Via di Contrada Comune 159<br />
                  00049 Velletri (RM)
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Autorità di Controllo</h4>
                <p className="text-gray-600">
                  Per reclami puoi contattare il Garante per la Protezione dei Dati Personali: 
                  <a href="https://www.gpdp.it" className="text-amber-700 hover:text-amber-800 ml-1">www.gpdp.it</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white mt-16">
          <h2 className="text-3xl font-bold mb-4">
            Hai Domande sulla Privacy?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Il nostro team è disponibile per chiarire qualsiasi dubbio sui tuoi dati.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
              <Mail className="mr-2 h-5 w-5" />
              Contatta Privacy Team
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