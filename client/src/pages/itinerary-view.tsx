import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft,
  Download,
  QrCode,
  Hotel
} from "lucide-react";

export default function ItineraryView() {
  const { uniqueUrl } = useParams<{ uniqueUrl: string }>();

  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ["/api/itinerary", uniqueUrl],
    enabled: !!uniqueUrl,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento itinerario...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Itinerario non trovato</h1>
          <p className="text-gray-600 mb-4">L'itinerario richiesto non esiste o non è più disponibile.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna Indietro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {itinerary.hotel?.logoUrl && (
                <img 
                  src={itinerary.hotel.logoUrl} 
                  alt={itinerary.hotel.name}
                  className="h-12 w-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">{itinerary.title}</h1>
                <p className="text-gray-600">
                  {itinerary.hotel?.name} • {itinerary.hotel?.city}, {itinerary.hotel?.region}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <QrCode className="h-4 w-4 mr-1" />
                QR Code
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Guest Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Informazioni Soggiorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Hotel className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  <strong>Ospite:</strong> {itinerary.guestProfile?.referenceName}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  <strong>Persone:</strong> {itinerary.guestProfile?.numberOfPeople}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  <strong>Periodo:</strong> {new Date(itinerary.guestProfile?.checkInDate).toLocaleDateString('it-IT')} - {new Date(itinerary.guestProfile?.checkOutDate).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {itinerary.description && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-gray-700">{itinerary.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Daily Itinerary */}
        <div className="space-y-6">
          {itinerary.days?.map((day: any, index: number) => (
            <Card key={day.day} className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Giorno {day.day} - {new Date(day.date).toLocaleDateString('it-IT', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <Badge variant="secondary">
                    {day.activities?.length || 0} attività
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {day.activities && day.activities.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {day.activities.map((activity: any, actIndex: number) => (
                      <div key={actIndex} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900 mb-1">
                                  {activity.activity}
                                </h4>
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span className="font-medium">{activity.time}</span>
                                  {activity.duration && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>{activity.duration}</span>
                                    </>
                                  )}
                                </div>
                                {activity.location && (
                                  <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>{activity.location}</span>
                                  </div>
                                )}
                                <p className="text-gray-700 mb-3">{activity.description}</p>
                                {activity.notes && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                      <strong>Note:</strong> {activity.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {activity.experienceId && (
                                <Badge variant="outline" className="ml-4">
                                  Esperienza Locale
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Nessuna attività programmata per questo giorno
                  </div>
                )}
              </CardContent>
            </Card>
          )) || (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun itinerario disponibile</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 mb-4">
              Questo itinerario è stato generato appositamente per la vostra esperienza presso <strong>{itinerary.hotel?.name}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Per informazioni o modifiche, contattate la reception dell'hotel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}