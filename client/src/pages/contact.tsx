import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  HeadphonesIcon
} from "lucide-react";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import Footer from "@/components/footer";

export default function Contact() {
  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "info@landeo.it",
      description: "Per informazioni generali e commerciali",
      action: "Invia Email",
      href: "mailto:info@landeo.it"
    },
    {
      icon: HeadphonesIcon,
      title: "Supporto Tecnico",
      value: "supporto@landeo.it",
      description: "Per assistenza tecnica e problemi",
      action: "Contatta Supporto",
      href: "mailto:supporto@landeo.it"
    },
    {
      icon: Phone,
      title: "Telefono",
      value: "+39.328.30.93.519",
      description: "Assistenza telefonica clienti premium",
      action: "Chiama",
      href: "tel:+393283093519"
    },
    {
      icon: MapPin,
      title: "Sede",
      value: "Velletri (RM), Via di Contrada Comune 159",
      description: "00049 Velletri (RM)",
      action: "Vedi Mappa",
      href: "#"
    }
  ];

  const officeHours = [
    { day: "Lunedì - Venerdì", hours: "9:00 - 18:00" },
    { day: "Sabato", hours: "9:00 - 13:00" },
    { day: "Domenica", hours: "Chiuso" }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
            Contatti
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Parliamo del tuo<br />
            <span className="text-amber-700">progetto</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Il nostro team è pronto ad aiutarti a trasformare l'esperienza dei tuoi ospiti. 
            Contattaci per una consulenza personalizzata.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <Send className="w-6 h-6 text-amber-700 mr-2" />
                  Invia un Messaggio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome *
                      </label>
                      <Input placeholder="Il tuo nome" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cognome *
                      </label>
                      <Input placeholder="Il tuo cognome" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input type="email" placeholder="tua@email.com" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Hotel
                    </label>
                    <Input placeholder="Nome del tuo hotel" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono
                    </label>
                    <Input placeholder="+39 123 456 7890" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio *
                    </label>
                    <Textarea 
                      placeholder="Raccontaci del tuo hotel e di come possiamo aiutarti..."
                      rows={5}
                    />
                  </div>
                  
                  <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Invia Messaggio
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="grid gap-6">
              {contactInfo.map((contact, index) => (
                <Card key={index} className="border-amber-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <contact.icon className="w-6 h-6 text-amber-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{contact.title}</h3>
                        <p className="text-lg font-medium text-amber-700 mb-1">{contact.value}</p>
                        <p className="text-gray-600 text-sm mb-3">{contact.description}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          {contact.action}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Office Hours */}
            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 text-amber-700 mr-2" />
                  Orari di Ufficio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {officeHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{schedule.day}</span>
                      <span className="text-gray-600">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> Il supporto email è disponibile 24/7 con risposta entro 24 ore.
                  </p>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-700 to-amber-800 rounded-2xl p-12 text-white mt-16">
          <h2 className="text-3xl font-bold mb-4">
            Pronto per Iniziare?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Non aspettare. Inizia subito a migliorare l'esperienza dei tuoi ospiti con Landeo.
          </p>
          <Link href="/hotel-register">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-50">
              Registra il Tuo Hotel Gratis
            </Button>
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}