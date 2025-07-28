import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Star,
  Loader2,
  Wine,
  Mountain,
  Camera,
  Utensils,
  TreePine,
  Waves,
  Bot,
  Sparkles,
  Check,
  X,
  Users,
  Building,
  Music,
  Target,
  Heart,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertLocalExperienceSchema } from "@shared/schema";
import type { InsertLocalExperience } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

import { LANDEO_CATEGORIES } from "@shared/categories";

const CATEGORIES = [
  // Storia e Cultura
  { value: "musei", label: "Musei e Arte", icon: Camera, color: "bg-blue-100 text-blue-700" },
  { value: "monumenti", label: "Monumenti Storici", icon: Building, color: "bg-blue-100 text-blue-700" },
  { value: "chiese", label: "Chiese e Santuari", icon: Heart, color: "bg-blue-100 text-blue-700" },
  { value: "borghi", label: "Borghi Medievali", icon: Camera, color: "bg-amber-100 text-amber-700" },
  { value: "archeologia", label: "Siti Archeologici", icon: Sparkles, color: "bg-amber-100 text-amber-700" },
  
  // Gastronomia
  { value: "ristoranti", label: "Ristoranti Tipici", icon: Utensils, color: "bg-green-100 text-green-700" },
  { value: "vino", label: "Vino e Cantine", icon: Wine, color: "bg-purple-100 text-purple-700" },
  { value: "mercati", label: "Mercati Locali", icon: Building, color: "bg-green-100 text-green-700" },
  
  // Natura e Outdoor
  { value: "parchi", label: "Parchi Naturali", icon: TreePine, color: "bg-emerald-100 text-emerald-700" },
  { value: "trekking", label: "Trekking e Passeggiate", icon: Mountain, color: "bg-emerald-100 text-emerald-700" },
  { value: "laghi", label: "Laghi e Panorami", icon: Waves, color: "bg-cyan-100 text-cyan-700" },
  { value: "giardini", label: "Giardini Botanici", icon: TreePine, color: "bg-green-100 text-green-700" },
  
  // Sport e Attività
  { value: "sport", label: "Attività Sportive", icon: Mountain, color: "bg-red-100 text-red-700" },
  { value: "ciclismo", label: "Ciclismo", icon: Mountain, color: "bg-orange-100 text-orange-700" },
  
  // Shopping
  { value: "shopping", label: "Shopping e Artigianato", icon: Building, color: "bg-gray-100 text-gray-700" }
];

const TARGET_AUDIENCES = [
  "famiglia", "coppia", "singolo", "gruppo_lavoro", "anziani"
];

// Funzione per ottenere il badge di match
function getMatchBadge(matchType: 'high' | 'medium' | 'low') {
  switch (matchType) {
    case 'high':
      return {
        text: "🎯 Preferenza Top",
        className: "bg-green-100 text-green-800 border-green-200"
      };
    case 'medium':
      return {
        text: "✨ Buon Match", 
        className: "bg-amber-100 text-amber-800 border-amber-200"
      };
    case 'low':
      return {
        text: "Matching Standard",
        className: "bg-gray-100 text-gray-600 border-gray-200"
      };
  }
}

// Funzione per auto-categorizzare le esperienze basata sul nome
function getSmartCategory(name: string, description: string = ""): string {
  const text = (name + " " + description).toLowerCase();
  
  // Divertimento
  if (text.includes("cinecittà") || text.includes("luneur") || text.includes("rainbow") || 
      text.includes("parco divertimenti") || text.includes("divertimento") || 
      text.includes("luna park") || text.includes("videogiochi") || text.includes("giochi")) {
    return "divertimento";
  }
  
  // Cultura/Storia/Arte
  if (text.includes("museo") || text.includes("galleria") || text.includes("palazzo") || 
      text.includes("basilica") || text.includes("chiesa") || text.includes("duomo") || 
      text.includes("cappella") || text.includes("archeologico") || text.includes("arte") ||
      text.includes("storico") || text.includes("storia") || text.includes("cultura") ||
      text.includes("uffizi") || text.includes("vaticano") || text.includes("colosseo") ||
      text.includes("foro romano") || text.includes("pantheon")) {
    if (text.includes("arte") || text.includes("galleria") || text.includes("pittura") || 
        text.includes("scultura") || text.includes("uffizi")) {
      return "arte";
    }
    if (text.includes("storia") || text.includes("storico") || text.includes("archeologico") ||
        text.includes("antico") || text.includes("romano") || text.includes("medievale")) {
      return "storia";
    }
    return "cultura";
  }
  
  // Gastronomia/Degustazione
  if (text.includes("vino") || text.includes("cantina") || text.includes("degustazione") || 
      text.includes("enogastronomia") || text.includes("vigneto") || text.includes("chianti") ||
      text.includes("tasting") || text.includes("wine")) {
    return "degustazione";
  }
  
  if (text.includes("cooking") || text.includes("cucina") || text.includes("chef") || 
      text.includes("ristorante") || text.includes("food") || text.includes("gastronomia") ||
      text.includes("trattoria") || text.includes("osteria") || text.includes("pizzeria")) {
    return "gastronomia";
  }
  
  // Natura
  if (text.includes("parco") || text.includes("giardino") || text.includes("natura") || 
      text.includes("villa") || text.includes("bosco") || text.includes("lago") || 
      text.includes("montagna") || text.includes("collina") || text.includes("passeggiata") ||
      text.includes("trekking") || text.includes("escursione")) {
    return "natura";
  }
  
  // Avventura/Sport
  if (text.includes("rafting") || text.includes("climbing") || text.includes("adventure") || 
      text.includes("zipline") || text.includes("canoa") || text.includes("kayak") || 
      text.includes("bicicletta") || text.includes("bike") || text.includes("sport") ||
      text.includes("avventura") || text.includes("outdoor")) {
    return "avventura";
  }
  
  // Relax
  if (text.includes("spa") || text.includes("terme") || text.includes("relax") || 
      text.includes("benessere") || text.includes("massaggio") || text.includes("wellness") ||
      text.includes("bagno") || text.includes("piscina")) {
    return "relax";
  }
  
  // Famiglia
  if (text.includes("famiglia") || text.includes("bambini") || text.includes("kids") || 
      text.includes("family") || text.includes("zoo") || text.includes("acquario")) {
    return "famiglia";
  }
  
  // Shopping
  if (text.includes("shopping") || text.includes("outlet") || text.includes("mercato") || 
      text.includes("negozi") || text.includes("centro commerciale")) {
    return "shopping";
  }
  
  // Default: cultura
  return "cultura";
}

export default function LocalExperiences() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("none");
  const [showMatches, setShowMatches] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const hotelId = user?.hotelId;

  // Fetch local experiences
  const { data: experiences, isLoading } = useQuery({
    queryKey: ["/api/hotels", hotelId, "local-experiences"],
    enabled: !!hotelId,
  });

  // Fetch guest profiles for matching
  const { data: guestProfiles } = useQuery({
    queryKey: ["/api/hotels", hotelId, "guest-profiles"],
    enabled: !!hotelId,
  });

  // Fetch experience matches for selected guest
  const { data: matchData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["/api/hotels", hotelId, "local-experiences", "matches", selectedGuestId],
    enabled: !!hotelId && !!selectedGuestId && selectedGuestId !== "none",
  });

  // Fetch pending attractions
  const { data: pendingAttractions, isLoading: isLoadingPending } = useQuery({
    queryKey: ["/api/hotels", hotelId, "pending-attractions"],
    enabled: !!hotelId,
  });

  const form = useForm<InsertLocalExperience>({
    resolver: zodResolver(insertLocalExperienceSchema),
    defaultValues: {
      hotelId: hotelId || "",
      name: "",
      category: "",
      description: "",
      location: "",
      distance: "",
      duration: "",
      priceRange: "",
      contactInfo: {},
      openingHours: "",
      seasonality: "",
      targetAudience: [],
      rating: "",
      imageUrl: "",
      isActive: true,
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertLocalExperience) => {
      const method = editingExperience ? "PUT" : "POST";
      const url = editingExperience ? `/api/local-experiences/${editingExperience.id}` : "/api/local-experiences";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: editingExperience ? "Esperienza aggiornata con successo!" : "Esperienza creata con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "local-experiences"] });
      setIsDialogOpen(false);
      setEditingExperience(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/local-experiences/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Esperienza eliminata con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "local-experiences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  // Update experience mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLocalExperience> }) => {
      const res = await apiRequest("PUT", `/api/local-experiences/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Esperienza aggiornata con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "local-experiences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  // Generate AI attractions mutation
  const generateAttractionsMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/hotels/${hotelId}/local-experiences/generate`),
    onMutate: () => {
      // Show warning message during generation
      toast({
        title: "Generazione in corso",
        description: "La generazione delle Esperienze Locali può richiedere alcuni minuti. Non chiudere o aggiornare questa pagina fino al termine della generazione.",
        duration: 10000, // Keep the toast for 10 seconds
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "pending-attractions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "local-experiences"] });
      toast({
        title: "Attrazioni generate",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nella generazione delle attrazioni",
        variant: "destructive",
      });
    },
  });

  // Delete all experiences mutation
  const deleteAllMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/hotels/${hotelId}/local-experiences`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "local-experiences"] });
      toast({
        title: "Successo",
        description: "Tutte le esperienze sono state eliminate con successo!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione delle esperienze",
        variant: "destructive",
      });
    },
  });

  // Approve attraction mutation
  const approveAttractionMutation = useMutation({
    mutationFn: (attractionId: string) => apiRequest("POST", `/api/hotels/${hotelId}/pending-attractions/${attractionId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "pending-attractions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "local-experiences"] });
      toast({
        title: "Attrazione approvata",
        description: "L'attrazione è stata aggiunta alle esperienze locali",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Non è stato possibile approvare l'attrazione",
        variant: "destructive",
      });
    },
  });

  // Reject attraction mutation
  const rejectAttractionMutation = useMutation({
    mutationFn: (attractionId: string) => apiRequest("POST", `/api/hotels/${hotelId}/pending-attractions/${attractionId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "pending-attractions"] });
      toast({
        title: "Attrazione rifiutata",
        description: "L'attrazione è stata rimossa dall'elenco",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Non è stato possibile rifiutare l'attrazione",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLocalExperience) => {
    // Process contact info
    const contactInfo: any = {};
    const phoneValue = (form.watch("contactInfo") as any)?.phone;
    const emailValue = (form.watch("contactInfo") as any)?.email;
    const websiteValue = (form.watch("contactInfo") as any)?.website;
    
    if (phoneValue) contactInfo.phone = phoneValue;
    if (emailValue) contactInfo.email = emailValue;
    if (websiteValue) contactInfo.website = websiteValue;
    
    mutation.mutate({
      ...data,
      contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
    });
  };

  const handleEdit = (experience: any) => {
    setEditingExperience(experience);
    form.reset({
      ...experience,
      contactInfo: experience.contactInfo || {},
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleNewExperience = () => {
    setEditingExperience(null);
    form.reset({
      hotelId: hotelId || "",
      name: "",
      category: "",
      description: "",
      location: "",
      distance: "",
      duration: "",
      priceRange: "",
      contactInfo: {},
      openingHours: "",
      seasonality: "",
      targetAudience: [],
      rating: "",
      imageUrl: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const toggleTargetAudience = (audience: string) => {
    const current = form.watch("targetAudience") || [];
    const updated = current.includes(audience) 
      ? current.filter(a => a !== audience)
      : [...current, audience];
    form.setValue("targetAudience", updated);
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Esperienze Locali
            </h2>
            <p className="text-gray-600">
              Gestisci le esperienze e attività locali convenzionate con l'hotel
            </p>
          </div>
          
          <div className="flex gap-2">

            <Button 
              onClick={() => generateAttractionsMutation.mutate()}
              disabled={generateAttractionsMutation.isPending}
              variant="outline"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
            >
              {generateAttractionsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Genera con AI
            </Button>
            
            {experiences && experiences.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={deleteAllMutation.isPending}
                  >
                    {deleteAllMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina Esperienze
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare tutte le esperienze?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione eliminerà definitivamente tutte le {experiences.length} esperienze locali. 
                      Non è possibile annullare questa operazione.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteAllMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Elimina Tutte
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewExperience} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova Esperienza
                </Button>
              </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {editingExperience ? "Modifica Esperienza" : "Nuova Esperienza Locale"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Esperienza *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="es. Cinecittà World, Uffizi, Chianti Tour..."
                      className="mt-1"
                      onChange={(e) => {
                        // Auto-suggest category based on name
                        const name = e.target.value;
                        if (name.length > 3 && !form.watch("category")) {
                          const suggestedCategory = getSmartCategory(name, form.watch("description") || "");
                          form.setValue("category", suggestedCategory);
                        }
                        // Update the form register
                        form.register("name").onChange(e);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select 
                      value={form.watch("category")} 
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrizione *</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Descrizione dettagliata dell'esperienza..."
                    className="mt-1"
                    rows={3}
                    onChange={(e) => {
                      // Re-evaluate category when description changes
                      const description = e.target.value;
                      const name = form.watch("name") || "";
                      if (name.length > 3 && description.length > 10) {
                        const suggestedCategory = getSmartCategory(name, description);
                        if (suggestedCategory !== form.watch("category")) {
                          form.setValue("category", suggestedCategory);
                        }
                      }
                      // Update the form register
                      form.register("description").onChange(e);
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Località *</Label>
                    <Input
                      id="location"
                      {...form.register("location")}
                      placeholder="Castellina in Chianti"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="distance">Distanza dall'Hotel</Label>
                    <Input
                      id="distance"
                      {...form.register("distance")}
                      placeholder="15 min / 10 km"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Durata</Label>
                    <Input
                      id="duration"
                      {...form.register("duration")}
                      placeholder="2 ore / mezza giornata"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priceRange">Fascia di Prezzo</Label>
                    <Input
                      id="priceRange"
                      {...form.register("priceRange")}
                      placeholder="€50-80 a persona"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      {...form.register("contactInfo.phone" as any)}
                      placeholder="+39 055 123456"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("contactInfo.email" as any)}
                      placeholder="info@experience.it"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Sito Web</Label>
                    <Input
                      id="website"
                      {...form.register("contactInfo.website" as any)}
                      placeholder="https://experience.it"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openingHours">Orari di Apertura</Label>
                    <Input
                      id="openingHours"
                      {...form.register("openingHours")}
                      placeholder="09:00 - 18:00"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="seasonality">Stagionalità</Label>
                    <Input
                      id="seasonality"
                      {...form.register("seasonality")}
                      placeholder="Tutto l'anno / Aprile-Ottobre"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Valutazione</Label>
                    <Input
                      id="rating"
                      {...form.register("rating")}
                      placeholder="4.8"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="imageUrl">URL Immagine</Label>
                    <Input
                      id="imageUrl"
                      {...form.register("imageUrl")}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Target Audience</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TARGET_AUDIENCES.map((audience) => (
                      <Button
                        key={audience}
                        type="button"
                        size="sm"
                        variant={form.watch("targetAudience")?.includes(audience) ? "default" : "outline"}
                        onClick={() => toggleTargetAudience(audience)}
                        className="capitalize"
                      >
                        {audience}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={form.watch("isActive")} 
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                  />
                  <Label>Esperienza attiva</Label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {mutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {editingExperience ? "Aggiorna" : "Crea"} Esperienza
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pending Attractions Section */}
        {pendingAttractions && pendingAttractions.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Bot className="w-5 h-5 mr-2 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Attrazioni suggerite da AI ({pendingAttractions.length})
                </h3>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                L'intelligenza artificiale ha trovato queste attrazioni locali. Approva quelle che vuoi aggiungere alle tue esperienze.
              </p>
              
              <div className="grid gap-3">
                {pendingAttractions.map((attraction) => (
                  <div key={attraction.id} className="bg-white border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge variant="secondary" className="mr-2 text-xs">
                            {attraction.attractionType}
                          </Badge>
                          <span className="text-xs text-gray-500">{attraction.estimatedDistance}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{attraction.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{attraction.description}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {attraction.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {attraction.duration}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {attraction.priceRange}
                          </Badge>
                        </div>
                        {attraction.highlights && attraction.highlights.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {attraction.highlights.slice(0, 3).map((highlight, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => approveAttractionMutation.mutate(attraction.id)}
                          disabled={approveAttractionMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {approveAttractionMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectAttractionMutation.mutate(attraction.id)}
                          disabled={rejectAttractionMutation.isPending}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          {rejectAttractionMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Guest Preference Matching */}
        {guestProfiles && guestProfiles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Matching Preferenze Ospiti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <Label htmlFor="guest-select">Seleziona Ospite per Matching</Label>
                  <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleziona un ospite per vedere i match delle preferenze" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessun filtro</SelectItem>
                      {guestProfiles.map((guest) => (
                        <SelectItem key={guest.id} value={guest.id}>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {guest.referenceName} ({guest.type})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedGuestId && selectedGuestId !== "none" && matchData && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="text-sm text-gray-600">
                      <strong>Preferenze:</strong> {matchData.guestProfile.preferences.join(", ") || "Nessuna"}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedGuestId && selectedGuestId !== "none" && isLoadingMatches && (
                <div className="mt-4 flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Calcolando match...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading || isLoadingPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Local Experiences Grid */}
            {experiences && experiences.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(selectedGuestId && selectedGuestId !== "none" && matchData ? matchData.matches : experiences.map(exp => ({ experience: exp, matchType: 'low' as const, matchingPreferences: [] }))).map((match) => {
                  const experience = match.experience;
                  const categoryConfig = getCategoryConfig(experience.category);
                  const IconComponent = categoryConfig.icon;
                  const matchBadge = selectedGuestId && selectedGuestId !== "none" ? getMatchBadge(match.matchType) : null;
                  
                  return (
                    <Card key={experience.id} className="group hover:shadow-lg transition-shadow bg-white border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${categoryConfig.color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {categoryConfig.label}
                            </Badge>
                            {matchBadge && (
                              <Badge className={`text-xs border ${matchBadge.className}`}>
                                {matchBadge.text}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(experience)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminare l'esperienza locale?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione non può essere annullata. L'esperienza locale verrà eliminata definitivamente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(experience.id)} className="bg-red-600 hover:bg-red-700">
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <CardTitle className="text-lg font-semibold text-gray-900 mt-2">
                          {experience.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {experience.description}
                        </p>
                        
                        {selectedGuestId && selectedGuestId !== "none" && match.matchingPreferences && match.matchingPreferences.length > 0 && (
                          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center text-xs text-green-800">
                              <Heart className="h-3 w-3 mr-1" />
                              <span className="font-medium">Match: </span>
                              <span className="ml-1">{match.matchingPreferences.join(", ")}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{experience.location}</span>
                          </div>
                          
                          {experience.distance && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{experience.distance}</span>
                            </div>
                          )}
                          
                          {experience.duration && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{experience.duration}</span>
                            </div>
                          )}
                          
                          {experience.rating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                              <span>{experience.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {experience.targetAudience && experience.targetAudience.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {experience.targetAudience.slice(0, 3).map((audience, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs capitalize">
                                {audience}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <Switch 
                              checked={experience.isActive} 
                              onCheckedChange={(checked) => {
                                updateMutation.mutate({
                                  id: experience.id,
                                  data: { isActive: checked }
                                });
                              }}
                              disabled={updateMutation.isPending}
                              className="scale-75"
                            />
                            <span className="text-xs text-gray-500 ml-1">
                              {experience.isActive ? 'Attiva' : 'Inattiva'}
                            </span>
                          </div>
                          
                          {experience.priceRange && (
                            <Badge variant="outline" className="text-xs">
                              {experience.priceRange}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna esperienza locale
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Inizia aggiungendo manualmente le prime attrazioni Locali per i tuoi ospiti oppure usa l'AI per generare automaticamente suggerimenti di attrazioni locali entro 50km dal tuo hotel!
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => generateAttractionsMutation.mutate()}
                    disabled={generateAttractionsMutation.isPending}
                    variant="outline"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                  >
                    {generateAttractionsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Genera con AI
                  </Button>
                  <Button onClick={handleNewExperience} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi Esperienza
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
