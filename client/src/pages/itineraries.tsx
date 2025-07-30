import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/sidebar";
import { QRModal } from "@/components/qr-modal";
import { useToast } from "@/hooks/use-toast";

import { Link } from "wouter";
import { 
  Route, 
  Eye, 
  QrCode, 
  Calendar,
  Users,
  Clock,
  Share,
  Loader2,
  Plus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function Itineraries() {
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const hotelId = user?.hotelId;

  // Fetch itineraries
  const { data: itineraries, isLoading } = useQuery({
    queryKey: ["/api/hotels", hotelId, "itineraries"],
    enabled: !!hotelId,
  });

  // Fetch guest profiles for reference
  const { data: guestProfiles } = useQuery({
    queryKey: ["/api/hotels", hotelId, "guest-profiles"],
    enabled: !!hotelId,
  });

  // Fetch hotel data for QR modal
  const { data: hotel } = useQuery({
    queryKey: ["/api/hotels", hotelId],
    enabled: !!hotelId,
  });



  const handleShowQR = (itinerary: any) => {
    const guestProfile = guestProfiles?.find((g: any) => g.id === itinerary.guestProfileId);
    setSelectedItinerary({ ...itinerary, guestProfile });
    setQrModalOpen(true);
  };



  const handleShare = (itinerary: any) => {
    const domains = process.env.REPLIT_DOMAINS || "localhost:5000";
    const domain = domains.split(',')[0];
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const shareUrl = `${protocol}://${domain}/itinerary/${itinerary.uniqueUrl}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link Copiato",
        description: "Il link all'itinerario è stato copiato negli appunti!",
      });
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Attivo", className: "bg-success/10 text-success" };
      case "draft":
        return { label: "Bozza", className: "bg-warning/10 text-warning" };
      case "completed":
        return { label: "Completato", className: "bg-gray-100 text-gray-600" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-600" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Itinerari Generati
            </h2>
            <p className="text-gray-600">
              Gestisci tutti gli itinerari personalizzati creati per i tuoi ospiti
            </p>
          </div>
          
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Genera Nuovo Itinerario
            </Button>
          </Link>
        </div>

        {/* Itineraries List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {itineraries?.map((itinerary: any) => {
              const guestProfile = guestProfiles?.find((g: any) => g.id === itinerary.guestProfileId);
              const statusConfig = getStatusConfig(itinerary.status);
              
              return (
                <Card key={itinerary.id} className="card-hover">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-xl font-serif">
                            {itinerary.title}
                          </CardTitle>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {guestProfile?.referenceName || "Ospite"}
                            {guestProfile && ` (${guestProfile.numberOfPeople} persone)`}
                          </div>
                          
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {itinerary.days?.length || 1} giorni
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Creato: {formatDate(itinerary.createdAt)}
                          </div>
                        </div>
                        
                        {itinerary.description && (
                          <p className="text-gray-600 mt-2 line-clamp-2">
                            {itinerary.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Link href={`/itinerary/${itinerary.uniqueUrl}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizza
                          </Button>
                        </Link>
                        
                        {itinerary.qrCodeUrl && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShowQR(itinerary)}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            QR Code
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShare(itinerary)}
                        >
                          <Share className="h-4 w-4 mr-1" />
                          Condividi
                        </Button>

                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Quick preview of days */}
                    {itinerary.days && itinerary.days.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {itinerary.days.slice(0, 3).map((day: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">
                              Giorno {day.day} - {formatDate(day.date)}
                            </h4>
                            <div className="space-y-1">
                              {day.activities?.slice(0, 2).map((activity: any, actIndex: number) => (
                                <div key={actIndex} className="text-xs text-gray-600">
                                  <span className="font-medium">{activity.time}</span> - {activity.activity}
                                </div>
                              ))}
                              {day.activities?.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{day.activities.length - 2} altre attività
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {itinerary.days.length > 3 && (
                          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                              +{itinerary.days.length - 3} altri giorni
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Guest profile info */}
                    {guestProfile && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-600">
                              <strong>Ospiti:</strong> {guestProfile.referenceName}
                            </span>
                            <span className="text-gray-600">
                              <strong>Tipo:</strong> {guestProfile.type}
                            </span>
                            <span className="text-gray-600">
                              <strong>Camera:</strong> {guestProfile.roomNumber || "N/A"}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>Check-in: {formatDate(guestProfile.checkInDate)}</span>
                            <span>Check-out: {formatDate(guestProfile.checkOutDate)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {(!itineraries || itineraries.length === 0) && (
              <div className="text-center py-12">
                <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun itinerario generato
                </h3>
                <p className="text-gray-500 mb-4">
                  Inizia creando il primo itinerario personalizzato per i tuoi ospiti.
                </p>
                <Link href="/">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Genera Primo Itinerario
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

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
