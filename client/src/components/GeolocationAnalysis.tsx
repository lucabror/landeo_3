import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Compass, 
  Navigation, 
  Target, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GeolocationData {
  hotel: {
    name: string;
    postalCode: string;
    city: string;
    region: string;
    currentCoordinates: {
      latitude: number;
      longitude: number;
    } | null;
  };
  geolocation: {
    coordinates: {
      latitude: number;
      longitude: number;
    } | null;
    searchRadius: string;
    referencePoint: string;
    nearbyAreas: string[];
    geoContext: string;
    geoStatus: "available" | "needs_geocoding";
  };
  suggestions: {
    updateCoordinates: boolean;
    enhanceLocalExperiences: boolean;
    precisionLevel: "high" | "postal_code_only";
  };
}

export default function GeolocationAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdatingCoordinates, setIsUpdatingCoordinates] = useState(false);

  const { data: geoData, isLoading, error } = useQuery<GeolocationData>({
    queryKey: [`/api/hotels/${user?.hotelId}/geolocation/analysis`],
    enabled: !!user?.hotelId,
  });

  const updateCoordinatesMutation = useMutation({
    mutationFn: async () => {
      setIsUpdatingCoordinates(true);
      const response = await apiRequest(`/api/hotels/${user?.hotelId}/geolocation/update`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Coordinate aggiornate",
        description: `Posizione geografica aggiornata: ${data.coordinates.latitude.toFixed(6)}, ${data.coordinates.longitude.toFixed(6)}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${user?.hotelId}/geolocation/analysis`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore aggiornamento",
        description: error.message || "Impossibile aggiornare le coordinate",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdatingCoordinates(false);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Analisi Geolocalizzazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Analisi in corso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !geoData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Errore Geolocalizzazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Impossibile analizzare la geolocalizzazione dell'hotel.</p>
        </CardContent>
      </Card>
    );
  }

  const { hotel, geolocation, suggestions } = geoData;

  return (
    <div className="space-y-6">
      {/* Hotel Location Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Posizione Hotel
          </CardTitle>
          <CardDescription>
            Informazioni geografiche per {hotel.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Indirizzo</h4>
              <p className="text-sm text-gray-600">
                CAP {hotel.postalCode}<br />
                {hotel.city}, {hotel.region}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Coordinate GPS</h4>
              {hotel.currentCoordinates ? (
                <div className="text-sm">
                  <p>Lat: {hotel.currentCoordinates.latitude.toFixed(6)}</p>
                  <p>Lng: {hotel.currentCoordinates.longitude.toFixed(6)}</p>
                  <Badge variant="outline" className="mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Disponibili
                  </Badge>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-gray-500">Non disponibili</p>
                  <Badge variant="secondary" className="mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Da aggiornare
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geolocation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Analisi Geografica
          </CardTitle>
          <CardDescription>
            Area di ricerca per le attrazioni locali
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Centro di ricerca</h4>
              <p className="text-sm">{geolocation.referencePoint}</p>
              <p className="text-xs text-gray-500 mt-1">
                Raggio: {geolocation.searchRadius}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stato geolocalizzazione</h4>
              <Badge 
                variant={geolocation.geoStatus === "available" ? "default" : "secondary"}
                className="mb-2"
              >
                {geolocation.geoStatus === "available" ? "Attiva" : "Da configurare"}
              </Badge>
              <p className="text-xs text-gray-500">
                Precisione: {suggestions.precisionLevel === "high" ? "Alta" : "Solo CAP"}
              </p>
            </div>
          </div>

          {geolocation.nearbyAreas.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Aree circostanti</h4>
                <div className="flex flex-wrap gap-2">
                  {geolocation.nearbyAreas.map((area, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {geolocation.geoContext && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Contesto geografico</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {geolocation.geoContext}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions & Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Azioni Consigliate
          </CardTitle>
          <CardDescription>
            Ottimizza la geolocalizzazione per migliori raccomandazioni AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.updateCoordinates && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-blue-900">Aggiorna coordinate GPS</h5>
                <p className="text-sm text-blue-700 mb-3">
                  Le coordinate GPS precise migliorano la qualità delle raccomandazioni AI
                  e il calcolo delle distanze.
                </p>
                <Button
                  onClick={() => updateCoordinatesMutation.mutate()}
                  disabled={isUpdatingCoordinates}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingCoordinates ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Aggiorna Coordinate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {suggestions.enhanceLocalExperiences && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-green-900">Sistema pronto</h5>
                <p className="text-sm text-green-700">
                  La geolocalizzazione è configurata correttamente. Puoi generare
                  esperienze locali con targeting geografico avanzato.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}