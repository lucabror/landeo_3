import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoute } from "wouter";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  Globe,
  Star,
  Navigation,
  Heart,
  Camera,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ItineraryView() {
  const [match, params] = useRoute("/itinerary/:uniqueUrl");
  const uniqueUrl = params?.uniqueUrl;

  // Fetch itinerary by unique URL
  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ["/api/itinerary", uniqueUrl],
    enabled: !!uniqueUrl,
  });

  // Get guest profile data from the itinerary
  const guestProfile = itinerary?.guestProfile;
  const hotel = itinerary?.hotel;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento itinerario...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Itinerario Non Trovato
            </h2>
            <p className="text-gray-600">
              L'itinerario richiesto non esiste o non è più disponibile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with hotel branding */}
      <div className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold mb-2">
              {hotel?.name || "Hotel"}
            </h1>
            {hotel?.address && (
              <p className="text-primary-foreground/80">
                {hotel.address}, {hotel.city}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Itinerary Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="text-center">
              <CardTitle className="text-2xl font-serif text-primary mb-4">
                {itinerary.title}
              </CardTitle>
              
              {guestProfile && (
                <div className="flex items-center justify-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{guestProfile.referenceName}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{itinerary.days?.length || 1} giorni</span>
                  </div>
                </div>
              )}
              
              {itinerary.description && (
                <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                  {itinerary.description}
                </p>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Itinerary Days */}
        {itinerary.days && itinerary.days.length > 0 && (
          <div className="space-y-8">
            {itinerary.days.map((day: any, dayIndex: number) => (
              <Card key={dayIndex} className="overflow-hidden">
                <CardHeader className="bg-secondary text-white">
                  <CardTitle className="text-xl font-serif">
                    Giorno {day.day} - {formatDate(day.date)}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  {day.activities && day.activities.length > 0 && (
                    <div className="divide-y divide-gray-200">
                      {day.activities.map((activity: any, actIndex: number) => (
                        <div key={actIndex} className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                                <Clock className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {activity.activity}
                                  </h3>
                                  <div className="flex items-center text-accent font-medium">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {formatTime(activity.time)}
                                    {activity.duration && (
                                      <span className="ml-2 text-gray-500">
                                        ({activity.duration})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-gray-600 mb-3">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{activity.location}</span>
                              </div>
                              
                              {activity.description && (
                                <p className="text-gray-700 mb-3">
                                  {activity.description}
                                </p>
                              )}
                              
                              {activity.notes && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                                  <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> {activity.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contact Information */}
        {hotel && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center font-serif">
                Informazioni di Contatto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {hotel.phone && (
                  <div className="flex flex-col items-center">
                    <Phone className="h-8 w-8 text-primary mb-2" />
                    <span className="font-medium">Telefono</span>
                    <a 
                      href={`tel:${hotel.phone}`}
                      className="text-primary hover:underline"
                    >
                      {hotel.phone}
                    </a>
                  </div>
                )}
                
                {hotel.email && (
                  <div className="flex flex-col items-center">
                    <Mail className="h-8 w-8 text-primary mb-2" />
                    <span className="font-medium">Email</span>
                    <a 
                      href={`mailto:${hotel.email}`}
                      className="text-primary hover:underline"
                    >
                      {hotel.email}
                    </a>
                  </div>
                )}
                
                {hotel.website && (
                  <div className="flex flex-col items-center">
                    <Globe className="h-8 w-8 text-primary mb-2" />
                    <span className="font-medium">Sito Web</span>
                    <a 
                      href={hotel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visita il sito
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Generato da {hotel?.name || "Hotel"} • {new Date().toLocaleDateString("it-IT")}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Buon viaggio e grazie per aver scelto la nostra struttura!
          </p>
        </div>
      </div>
    </div>
  );
}
