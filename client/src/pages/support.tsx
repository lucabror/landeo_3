import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageCircle, 
  FileText, 
  Video,
  Search,
  Clock,
  CheckCircle
} from "lucide-react";
import aiTourLogo from "../assets/aitour-logo.png";

export default function Support() {
  const supportOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Supporto via email con risposta entro 24 ore",
      action: "Invia Email",
      href: "mailto:borroluca@gmail.com",
      availability: "24/7"
    },
    {
      icon: Phone,
      title: "Supporto Telefonico",
      description: "Assistenza telefonica per clienti con pacchetti prepagati",
      action: "+39.328.30.93.519",
      href: "tel:+393283093519",
      availability: "Lun-Ven 9:00-18:00"
    }
  ];

  const faqCategories = [
    {
      title: "Primi Passi",
      questions: [
        {
          q: "Come registro il mio hotel su AiTour?",
          a: "Clicca su 'Inizia Gratis' nella homepage, inserisci la tua email e segui il processo di verifica. Riceverai un link di conferma via email."
        },
        {
          q: "Quanto tempo serve per configurare AiTour?",
          a: "Il setup iniziale richiede circa 5-10 minuti. Inserisci i dati del tuo hotel, aggiungi alcune esperienze locali e sei pronto per generare i primi itinerari."
        },
        {
          q: "Posso provare AiTour gratuitamente?",
          a: "Sì! Ogni nuovo hotel riceve 5 itinerari gratuiti per testare completamente la piattaforma senza alcun costo."
        }
      ]
    },
    {
      title: "Gestione Itinerari",
      questions: [
        {
          q: "Come funziona la generazione AI degli itinerari?",
          a: "L'AI analizza le preferenze degli ospiti, la durata del soggiorno e le esperienze locali disponibili per creare itinerari personalizzati e autentici."
        },
        {
          q: "Posso modificare gli itinerari generati?",
          a: "Sì, puoi modificare ogni singolo blocco dell'itinerario: cambiare attività, orari, descrizioni e aggiungere note personalizzate."
        },
        {
          q: "Gli ospiti possono accedere agli itinerari da mobile?",
          a: "Assolutamente! Gli itinerari sono ottimizzati per smartphone e tablet. Gli ospiti ricevono un link diretto o possono scansionare il QR code."
        }
      ]
    },
    {
      title: "Fatturazione e Crediti",
      questions: [
        {
          q: "Come funziona il sistema a crediti?",
          a: "Ogni itinerario generato costa 1 credito (1€). Puoi acquistare crediti in pacchetti convenienti con sconti."
        },
        {
          q: "I crediti hanno scadenza?",
          a: "No, i crediti acquistati non scadono mai. Puoi utilizzarli quando preferisci senza fretta."
        },
        {
          q: "Come posso acquistare più crediti?",
          a: "Nella dashboard del tuo hotel trovi la sezione 'Acquista Crediti' con tutti i pacchetti disponibili. Il pagamento avviene tramite bonifico bancario."
        }
      ]
    },
    {
      title: "Problemi Tecnici",
      questions: [
        {
          q: "Non riesco ad accedere al mio account",
          a: "Verifica di aver confermato l'email di registrazione. Se il problema persiste, usa 'Password Dimenticata' o contatta il supporto."
        },
        {
          q: "Il PDF dell'itinerario non si genera",
          a: "Controlla di aver completato tutte le informazioni del profilo ospite e che l'itinerario sia stato generato correttamente. Riprova dopo qualche minuto."
        },
        {
          q: "Gli ospiti non ricevono l'email con le preferenze",
          a: "Controlla che l'email dell'ospite sia corretta e verifica nella cartella spam. Puoi reinviare l'email dalla dashboard."
        },
        {
          q: "Gli itinerari AI generati vanno ricontrollati?",
          a: "Sì, per offrire ai tuoi ospiti un'esperienza di massima qualità è necessario ricontrollare manualmente gli itinerari generati e apportare modifiche se dovesse rendersi necessario. Il nostro algoritmo AI però generalmente offre itinerari impeccabili."
        }
      ]
    }
  ];

  const resources = [
    {
      icon: Video,
      title: "Video Tutorial",
      description: "Guida video completa per iniziare con AiTour",
      action: "Guarda Video"
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
            Centro Assistenza
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Siamo qui per<br />
            <span className="text-amber-700">aiutarti</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Il nostro team di supporto specializzato è sempre pronto ad assisterti. 
            Trova risposte immediate o contattaci direttamente.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {supportOptions.map((option, index) => (
            <Card key={index} className="border-amber-100 hover:shadow-lg transition-shadow text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <option.icon className="w-8 h-8 text-amber-700" />
                </div>
                <CardTitle className="text-xl text-gray-900">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <div className="flex items-center justify-center mb-4">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">{option.availability}</span>
                </div>
                <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white">
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Domande Frequenti
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <HelpCircle className="w-6 h-6 text-amber-700 mr-2" />
                  {category.title}
                </h3>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <Card key={faqIndex} className="border-gray-100">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">{faq.q}</h4>
                        <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div className="bg-white rounded-2xl p-8 mb-16 border border-amber-100">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Risorse Utili
          </h2>
          <div className="flex justify-center">
            {resources.map((resource, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <resource.icon className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  {resource.action}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Hai Bisogno di Aiuto Immediato?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Per problemi urgenti o assistenza prioritaria, contattaci direttamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
              <Mail className="mr-2 h-5 w-5" />
              borroluca@gmail.com
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Phone className="mr-2 h-5 w-5" />
              +39.328.30.93.519
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}