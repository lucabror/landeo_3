import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { ItineraryGenerator } from "@/components/itinerary-generator";
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
  Clock
} from "lucide-react";

// Mock hotel ID - in real app this would come from auth/context
const MOCK_HOTEL_ID = "hotel-1";

export default function Dashboard() {
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Fetch hotel stats
  const { data: stats } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID, "stats"],
  });

  // Fetch guest profiles
  const { data: guestProfiles } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID, "guest-profiles"],
  });

  // Fetch local experiences
  const { data: localExperiences } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID, "local-experiences"],
  });

  // Fetch recent itineraries
  const { data: itineraries } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID, "itineraries"],
  });

  // Mock hotel data
  const hotel = {
    name: "Grand Hotel Villa Medici",
    id: MOCK_HOTEL_ID
  };

  const handleShowQR = (itinerary: any) => {
    setSelectedItinerary(itinerary);
    setQrModalOpen(true);
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Dashboard Amministratore
          </h2>
          <p className="text-gray-600">
            Gestisci le esperienze turistiche personalizzate per i tuoi ospiti
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Create Guest Profile */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif">Nuovo Profilo Ospite</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Crea un nuovo profilo per personalizzare l'esperienza degli ospiti
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Crea Profilo
              </Button>
            </CardContent>
          </Card>

          {/* AI Itinerary Generation */}
          <ItineraryGenerator hotelId={MOCK_HOTEL_ID} />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Guests */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">Ospiti Attivi</CardTitle>
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
                <CardTitle className="text-lg font-serif">Esperienze Locali</CardTitle>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
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
              <CardTitle className="text-lg font-serif">Itinerari Recenti</CardTitle>
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
    </div>
  );
}
