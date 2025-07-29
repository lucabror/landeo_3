import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar";
import { QRModal } from "@/components/qr-modal";
import { useState } from "react";
import { 
  Users, 
  Route, 
  MapPin, 
  QrCode, 
  Eye, 
  Share, 
  TrendingUp,
  Plus,
  Star,
  Clock,
  CreditCard,
  Wallet,
  Settings,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Trash2,

} from "lucide-react";
import CreditPurchaseDialog from "@/components/credit-purchase-dialog";
import { ProtectedRoute, useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Mock hotel ID - in real app this would come from auth/context
const MOCK_HOTEL_ID = "d2dd46f0-97d3-4121-96e3-01500370c73f";

function DashboardContent() {
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use the user's hotel ID from authentication
  const hotelId = user?.hotelId || user?.id || MOCK_HOTEL_ID;
  
  console.log("Current user:", user);
  console.log("Using hotel ID:", hotelId);

  // Delete itinerary mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/itineraries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Itinerario eliminato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "itineraries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const handleDeleteItinerary = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo itinerario?")) {
      deleteItineraryMutation.mutate(id);
    }
  };

  // Fetch hotel stats
  const { data: stats } = useQuery({
    queryKey: ["/api/hotels", hotelId, "stats"],
  });

  // Fetch guest profiles
  const { data: guestProfiles } = useQuery({
    queryKey: ["/api/hotels", hotelId, "guest-profiles"],
  });

  // Fetch local experiences
  const { data: localExperiences } = useQuery({
    queryKey: ["/api/hotels", hotelId, "local-experiences"],
  });

  // Fetch recent itineraries
  const { data: itineraries } = useQuery({
    queryKey: ["/api/hotels", hotelId, "itineraries"],
  });

  // Fetch hotel credits with auto-refresh
  const { data: creditInfo = { credits: 0, totalCredits: 0, creditsUsed: 0 } } = useQuery({
    queryKey: ["/api/hotels", hotelId, "credits"],
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Fetch hotel credit purchases
  const { data: creditPurchases = [] } = useQuery({
    queryKey: ["/api/hotels", hotelId, "purchases"],
  });



  // Fetch hotel setup status
  const { data: setupStatus = { isComplete: false, hasLocalExperiences: false } } = useQuery({
    queryKey: [`/api/hotels/${hotelId}/setup-status`],
  });

  // Mock hotel data - in real app this would come from API
  const hotel = {
    name: "Grand Hotel Villa Medici",
    id: hotelId
  };

  const handleShowQR = (itinerary: any) => {
    setSelectedItinerary(itinerary);
    setQrModalOpen(true);
  };

  return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h2 className="dashboard-title text-3xl text-gray-900 mb-2">
            Dashboard Amministratore
          </h2>
          <p className="text-gray-600">
            Gestisci le esperienze turistiche personalizzate per i tuoi ospiti
          </p>
        </div>

        {/* Hotel Setup Status Banner */}
        {setupStatus && !(setupStatus as any)?.isComplete && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="flex items-center justify-between w-full">
              <div>
                <strong className="text-amber-800">Completa la Configurazione del Tuo Hotel</strong>
                <p className="text-amber-700 mt-1">
                  Per creare itinerari personalizzati e offrire un'esperienza unica ai tuoi ospiti, completa tutti i dati del tuo hotel inclusi i servizi offerti.
                </p>
              </div>
              <Link href="/hotel-setup">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Configura Ora
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Local Experiences Setup Banner */}
        {setupStatus && (setupStatus as any)?.isComplete && !(setupStatus as any)?.hasLocalExperiences && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <MapPin className="h-5 w-5 text-blue-600" />
            <AlertDescription className="flex items-center justify-between w-full">
              <div>
                <strong className="text-blue-800">Genera le Tue Esperienze Locali</strong>
                <p className="text-blue-700 mt-1">
                  Ora che il tuo hotel è configurato, crea un catalogo di esperienze locali per offrire itinerari personalizzati ai tuoi ospiti. Usa l'AI per generare suggerimenti automatici.
                </p>
              </div>
              <Link href="/local-experiences">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Genera Esperienze
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Credit Banner */}
        {(creditInfo as any)?.credits <= 5 && (
          <Card className="bg-orange-50 border-orange-200 mb-8">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Crediti in esaurimento</h3>
                  <p className="text-sm text-orange-700">
                    Hai solo {(creditInfo as any)?.credits} crediti rimasti. Acquista più crediti per continuare ad aggiungere ospiti.
                  </p>
                </div>
              </div>
              <CreditPurchaseDialog hotelId={hotelId} currentCredits={(creditInfo as any)?.credits || 0}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Acquista Crediti
                </Button>
              </CreditPurchaseDialog>
            </CardContent>
          </Card>
        )}

        {/* Pending Credit Purchases */}
        {Array.isArray(creditPurchases) && creditPurchases.filter((p: any) => p.status === 'pending').length > 0 && (
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="h-5 w-5" />
                Ordini Crediti in Elaborazione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditPurchases
                  .filter((p: any) => p.status === 'pending')
                  .map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {purchase.packageType === 'basic' && 'Pacchetto Base'}
                          {purchase.packageType === 'standard' && 'Pacchetto Standard'}
                          {purchase.packageType === 'premium' && 'Pacchetto Premium'}
                          {purchase.packageType === 'enterprise' && 'Pacchetto Enterprise'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          €{purchase.packagePrice} per {purchase.creditsAmount} crediti
                        </p>
                        <p className="text-xs text-gray-500">
                          Ordinato il {new Date(purchase.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          In Elaborazione
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          In attesa di approvazione
                        </p>
                      </div>
                    </div>
                  ))
                }
                <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded-md">
                  ℹ️ <strong>Processo di attivazione:</strong> I tuoi crediti saranno attivati entro 24 ore dall'approvazione dell'amministratore. 
                  Riceverai una conferma via email.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Crediti Disponibili</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(creditInfo as any)?.credits || 0}
                  </p>
                  {(creditInfo as any)?.credits <= 5 && (
                    <Badge variant="destructive" className="text-xs mt-1">In esaurimento!</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ospiti Attivi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats as any)?.activeGuests || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Route className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Itinerari Generati</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats as any)?.totalItineraries || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Esperienze Locali</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats as any)?.localExperiences || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">QR Code Attivi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats as any)?.activeQRCodes || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Create Guest Profile */}
          <Card className="card-hover max-w-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="card-title-modern text-lg">Nuovo Profilo Ospite</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Crea un nuovo profilo per personalizzare l'esperienza degli ospiti
              </p>
              <Link href="/guest-profiles" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Crea Profilo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Guests */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="card-title-modern text-lg">Ospiti Attivi</CardTitle>
                <Link href="/guest-profiles">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                    Vedi tutto
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(guestProfiles as any[])?.slice(0, 3).map((guest: any) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {guest.referenceName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {guest.numberOfPeople} persone • {guest.type}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Attivo
                    </Badge>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">Nessun ospite attivo</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Local Experiences */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="card-title-modern text-lg">Esperienze Locali</CardTitle>
                <div className="flex items-center gap-2">
                  <Link href="/local-experiences">
                    <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                      Vedi tutto
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(localExperiences as any[])?.slice(0, 3).map((experience: any) => (
                  <div key={experience.id} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {experience.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {experience.location} • {experience.distance}
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {experience.category}
                      </Badge>
                      {experience.rating && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 mr-1" />
                          {experience.rating}
                        </div>
                      )}
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">Nessuna esperienza configurata</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Itineraries */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="card-title-modern text-lg">Itinerari Recenti</CardTitle>
                <Link href="/itineraries">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                    Vedi tutto
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(itineraries as any[])?.slice(0, 3).map((itinerary: any) => (
                  <div key={itinerary.id} className="border-l-4 border-primary pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {itinerary.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={
                          itinerary.status === 'active' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }
                      >
                        {itinerary.status === 'active' ? 'Attivo' : 'Bozza'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {itinerary.guestProfile?.referenceName} • {itinerary.days?.length || 1} giorni
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" className="text-xs h-7">
                        <Eye className="mr-1 h-3 w-3" />
                        Visualizza
                      </Button>
                      {itinerary.qrCodeUrl && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-7"
                          onClick={() => handleShowQR(itinerary)}
                        >
                          <QrCode className="mr-1 h-3 w-3" />
                          QR
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs h-7 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteItinerary(itinerary.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">Nessun itinerario generato</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Modal */}
        {selectedItinerary && (
          <QRModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            itinerary={selectedItinerary}
            hotel={hotel}
            guestProfile={selectedItinerary.guestProfile}
          />
        )}
      </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRole="hotel">
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <DashboardContent />
      </div>
    </ProtectedRoute>
  );
}
