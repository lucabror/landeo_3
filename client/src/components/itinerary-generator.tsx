import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ItineraryGeneratorProps {
  hotelId: string;
}

export function ItineraryGenerator({ hotelId }: ItineraryGeneratorProps) {
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [duration, setDuration] = useState<string>("1");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch guest profiles
  const { data: guestProfiles } = useQuery({
    queryKey: ["/api/hotels", hotelId, "guest-profiles"],
    enabled: !!hotelId,
  });

  // Generate itinerary mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { guestProfileId: string; hotelId: string; days: number }) => {
      const res = await apiRequest("POST", "/api/itineraries/generate", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Itinerario Generato",
        description: "L'itinerario personalizzato è stato creato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "itineraries"] });
      setSelectedGuestId("");
      setDuration("1");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la generazione dell'itinerario",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedGuestId) {
      toast({
        title: "Errore",
        description: "Seleziona un profilo ospite",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      guestProfileId: selectedGuestId,
      hotelId,
      days: parseInt(duration),
    });
  };

  const selectedGuest = guestProfiles?.find((g: any) => g.id === selectedGuestId);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif">Genera Itinerario AI</CardTitle>
          <Sparkles className="h-5 w-5 text-secondary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Seleziona Ospite
          </Label>
          <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
            <SelectTrigger>
              <SelectValue placeholder="Scegli un profilo ospite" />
            </SelectTrigger>
            <SelectContent>
              {guestProfiles?.map((profile: any) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.referenceName} ({profile.numberOfPeople} persone) - {profile.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Durata Itinerario
          </Label>
          <RadioGroup value={duration} onValueChange={setDuration} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="1day" />
              <Label htmlFor="1day" className="text-sm">1 Giorno</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="2days" />
              <Label htmlFor="2days" className="text-sm">2 Giorni</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="3days" />
              <Label htmlFor="3days" className="text-sm">3 Giorni</Label>
            </div>
          </RadioGroup>
        </div>

        {selectedGuest && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preferenze AI</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Cultura
              </Badge>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                Gastronomia
              </Badge>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Natura
              </Badge>
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                Relax
              </Badge>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p><strong>Tipo:</strong> {selectedGuest.type}</p>
              <p><strong>Persone:</strong> {selectedGuest.numberOfPeople}</p>
              {selectedGuest.preferences && (
                <p><strong>Preferenze:</strong> {selectedGuest.preferences.join(", ")}</p>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !selectedGuestId}
          className="w-full hospitality-gradient text-white hover:opacity-90 transition-all"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Genera con AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
