import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Users, 
  Loader2, 
  CheckCircle2, 
  Camera,
  Utensils,
  TreePine,
  Waves,
  Mountain,
  Wine,
  Car,
  Clock,
  Star,
  Music,
  ShoppingBag,
  Building,
  MapPin
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { guestPreferencesSchema, type GuestPreferences } from "@shared/schema";

import { LANDEO_CATEGORIES } from "@shared/categories";

// PREFERENZE EMAIL = CATEGORIE ESPERIENZE LOCALI (corrispondenza 1:1)
const PREFERENCE_CATEGORIES = [
  {
    title: "Storia e Cultura",
    icon: Camera,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    preferences: LANDEO_CATEGORIES.filter(cat => 
      ['musei', 'monumenti', 'chiese', 'borghi', 'archeologia'].includes(cat.value)
    ).map(cat => cat.emailText)
  },
  {
    title: "Gastronomia",
    icon: Utensils,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    preferences: LANDEO_CATEGORIES.filter(cat => 
      ['ristoranti', 'vino', 'mercati'].includes(cat.value)
    ).map(cat => cat.emailText)
  },
  {
    title: "Natura e Outdoor",
    icon: TreePine,
    color: "bg-green-50 text-green-700 border-green-200",
    preferences: LANDEO_CATEGORIES.filter(cat => 
      ['parchi', 'trekking', 'laghi', 'giardini'].includes(cat.value)
    ).map(cat => cat.emailText)
  },
  {
    title: "Sport",
    icon: Mountain,
    color: "bg-red-50 text-red-700 border-red-200",
    preferences: LANDEO_CATEGORIES.filter(cat => 
      ['sport', 'ciclismo'].includes(cat.value)
    ).map(cat => cat.emailText)
  },
  {
    title: "Shopping",
    icon: ShoppingBag,
    color: "bg-pink-50 text-pink-700 border-pink-200",
    preferences: LANDEO_CATEGORIES.filter(cat => 
      ['shopping'].includes(cat.value)
    ).map(cat => cat.emailText)
  }
];

const DIETARY_RESTRICTIONS = [
  "Vegetariano", "Vegano", "Senza glutine", "Senza lattosio",
  "Allergico ai frutti di mare", "Allergico alle noci", "Halal", "Kosher"
];

const MOBILITY_NEEDS = [
  "Accessibilità carrozzina", "Supporto mobilità ridotta", "Ascensore necessario",
  "Percorsi brevi", "Trasporto privato", "Guida con auto"
];

interface GuestPreferencesPageProps {
  token: string;
}

export default function GuestPreferencesPage({ token }: GuestPreferencesPageProps) {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedMobility, setSelectedMobility] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<GuestPreferences>({
    resolver: zodResolver(guestPreferencesSchema),
    defaultValues: {
      preferences: [],
      otherPreferences: "",
      dietaryRestrictions: [],
      mobilityNeeds: [],
      specialInterests: "",
    },
  });

  // Fetch guest data
  const { data: guestData, isLoading, error } = useQuery({
    queryKey: ["/api/guest-preferences", token],
    retry: false,
  });

  // Determine language from guest data
  const language = guestData?.guestProfile?.emailLanguage || 'it';
  const isEnglish = language === 'en';

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: GuestPreferences) => {
      const res = await apiRequest("POST", `/api/guest-preferences/${token}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Perfetto!",
        description: "Le tue preferenze sono state salvate con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvataggio delle preferenze",
        variant: "destructive",
      });
    },
  });

  const handlePreferenceToggle = (preference: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const handleSubmit = () => {
    if (selectedPreferences.length < 3) {
      toast({
        title: "Selezione insufficiente",
        description: "Seleziona almeno 3-4 preferenze per personalizzare correttamente il tuo itinerario.",
        variant: "destructive"
      });
      return;
    }

    const formData = {
      preferences: selectedPreferences,
      otherPreferences: form.getValues("otherPreferences"),
      dietaryRestrictions: selectedDietary,
      mobilityNeeds: selectedMobility,
      specialInterests: form.getValues("specialInterests"),
    };

    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isEnglish ? "Invalid Link" : "Link non valido"}
            </h3>
            <p className="text-gray-600">
              {isEnglish 
                ? "The link may be expired or invalid. Please contact the hotel for assistance."
                : "Il link potrebbe essere scaduto o non valido. Contatta l'hotel per assistenza."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isEnglish ? "Thank you!" : "Grazie!"}
            </h3>
            <p className="text-gray-600 mb-4">
              {isEnglish 
                ? "Your preferences have been saved. We'll use this information to create a personalized itinerary for your stay."
                : "Le tue preferenze sono state salvate. Utilizzeremo queste informazioni per creare un itinerario personalizzato per il tuo soggiorno."
              }
            </p>
            <p className="text-sm text-gray-500">
              {isEnglish 
                ? "You'll receive your personalized itinerary before check-in."
                : "Riceverai il tuo itinerario personalizzato prima del check-in."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-serif">
              {isEnglish ? "Customize your stay" : "Personalizza il tuo soggiorno"}
            </CardTitle>
            <div className="text-blue-100">
              <Building className="h-5 w-5 inline mr-2" />
              {guestData?.hotel.name} - {guestData?.hotel.city}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {isEnglish 
                  ? `Welcome ${guestData?.guestProfile.referenceName}!`
                  : `Benvenuto/a ${guestData?.guestProfile.referenceName}!`
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {isEnglish 
                  ? `Stay from ${new Date(guestData?.guestProfile.checkInDate || "").toLocaleDateString('en-US')} to ${new Date(guestData?.guestProfile.checkOutDate || "").toLocaleDateString('en-US')}`
                  : `Soggiorno dal ${new Date(guestData?.guestProfile.checkInDate || "").toLocaleDateString('it-IT')} al ${new Date(guestData?.guestProfile.checkOutDate || "").toLocaleDateString('it-IT')}`
                }
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {guestData?.guestProfile.numberOfPeople} {isEnglish ? "people" : "persone"}
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {guestData?.guestProfile.type}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Main Preferences */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Le tue preferenze di viaggio
              </CardTitle>
              <p className="text-gray-600">
                Seleziona tutto ciò che ti interessa per ricevere suggerimenti personalizzati
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {PREFERENCE_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.title} className={`border rounded-lg p-4 ${category.color}`}>
                      <div className="flex items-center mb-3">
                        <IconComponent className="h-5 w-5 mr-2" />
                        <h4 className="font-medium">{category.title}</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {category.preferences.map((preference) => (
                          <label key={preference} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={selectedPreferences.includes(preference)}
                              onCheckedChange={() => handlePreferenceToggle(preference)}
                            />
                            <span className="text-sm">{preference}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dietary Restrictions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="h-5 w-5 mr-2" />
                Restrizioni alimentari
              </CardTitle>
              <p className="text-gray-600">
                Aiutaci a suggerirti i ristoranti giusti
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <label key={restriction} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedDietary.includes(restriction)}
                      onCheckedChange={() => {
                        setSelectedDietary(prev => 
                          prev.includes(restriction) 
                            ? prev.filter(r => r !== restriction)
                            : [...prev, restriction]
                        );
                      }}
                    />
                    <span className="text-sm">{restriction}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobility Needs */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2" />
                Esigenze di mobilità
              </CardTitle>
              <p className="text-gray-600">
                Selezione facoltativa per suggerirti esperienze accessibili
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MOBILITY_NEEDS.map((need) => (
                  <label key={need} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedMobility.includes(need)}
                      onCheckedChange={() => {
                        setSelectedMobility(prev => 
                          prev.includes(need) 
                            ? prev.filter(n => n !== need)
                            : [...prev, need]
                        );
                      }}
                    />
                    <span className="text-sm">{need}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Fields */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Altre preferenze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="otherPreferences">
                  Altre preferenze specifiche
                </Label>
                <Textarea
                  id="otherPreferences"
                  placeholder="Es: Preferisco attività mattutine, adoro i panorami, mi piacciono i posti poco turistici..."
                  {...form.register("otherPreferences")}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="specialInterests">
                  Interessi particolari o hobby
                </Label>
                <Textarea
                  id="specialInterests"
                  placeholder="Es: Fotografia, birdwatching, collezionismo, lettura, sport specifici..."
                  {...form.register("specialInterests")}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={selectedPreferences.length === 0 || submitMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Salva le mie preferenze
                    </>
                  )}
                </Button>
                
                {selectedPreferences.length === 0 && (
                  <p className="text-red-500 text-sm mt-2">
                    Seleziona almeno una preferenza per continuare
                  </p>
                )}
                
                <p className="text-gray-500 text-sm mt-4">
                  Il tuo itinerario personalizzato sarà creato in base a queste preferenze
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}