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
  Waves
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertLocalExperienceSchema } from "@shared/schema";
import type { InsertLocalExperience } from "@shared/schema";

// Mock hotel ID - in real app this would come from auth/context
const MOCK_HOTEL_ID = "hotel-1";

const CATEGORIES = [
  { value: "cultura", label: "Cultura", icon: Camera, color: "bg-primary/10 text-primary" },
  { value: "gastronomia", label: "Gastronomia", icon: Utensils, color: "bg-secondary/10 text-secondary" },
  { value: "natura", label: "Natura", icon: TreePine, color: "bg-success/10 text-success" },
  { value: "relax", label: "Relax", icon: Waves, color: "bg-blue-100 text-blue-700" },
  { value: "avventura", label: "Avventura", icon: Mountain, color: "bg-orange-100 text-orange-700" },
  { value: "degustazione", label: "Degustazione", icon: Wine, color: "bg-purple-100 text-purple-700" },
];

const TARGET_AUDIENCES = [
  "famiglia", "coppia", "singolo", "gruppo_lavoro", "anziani"
];

export default function LocalExperiences() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch local experiences
  const { data: experiences, isLoading } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID, "local-experiences"],
  });

  const form = useForm<InsertLocalExperience>({
    resolver: zodResolver(insertLocalExperienceSchema),
    defaultValues: {
      hotelId: MOCK_HOTEL_ID,
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
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", MOCK_HOTEL_ID, "local-experiences"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", MOCK_HOTEL_ID, "local-experiences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
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
    if (confirm("Sei sicuro di voler eliminare questa esperienza locale?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewExperience = () => {
    setEditingExperience(null);
    form.reset({
      hotelId: MOCK_HOTEL_ID,
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
                      placeholder="Scuderia Hilton"
                      className="mt-1"
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
                        {audience.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Esperienza Attiva</Label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
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
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingExperience ? "Aggiorna" : "Crea Esperienza"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Experiences Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences?.map((experience: any) => {
              const categoryConfig = getCategoryConfig(experience.category);
              const CategoryIcon = categoryConfig.icon;
              
              return (
                <Card key={experience.id} className="card-hover overflow-hidden">
                  <div className="relative">
                    {experience.imageUrl ? (
                      <img 
                        src={experience.imageUrl} 
                        alt={experience.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <CategoryIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(experience)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(experience.id)}
                        className="bg-white/90 hover:bg-white text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-serif line-clamp-1">
                          {experience.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {experience.location}
                          {experience.distance && ` • ${experience.distance}`}
                        </p>
                      </div>
                      {!experience.isActive && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Inattivo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {experience.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={categoryConfig.color}>
                          {categoryConfig.label}
                        </Badge>
                        {experience.rating && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                            {experience.rating}
                          </div>
                        )}
                      </div>
                      
                      {experience.duration && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          {experience.duration}
                        </div>
                      )}
                      
                      {experience.priceRange && (
                        <p className="text-sm font-medium text-gray-900">
                          {experience.priceRange}
                        </p>
                      )}
                      
                      {experience.targetAudience && experience.targetAudience.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {experience.targetAudience.slice(0, 3).map((audience: string) => (
                            <Badge 
                              key={audience} 
                              variant="outline" 
                              className="text-xs capitalize"
                            >
                              {audience.replace("_", " ")}
                            </Badge>
                          ))}
                          {experience.targetAudience.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{experience.targetAudience.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {(!experiences || experiences.length === 0) && (
              <div className="col-span-full text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna esperienza locale
                </h3>
                <p className="text-gray-500 mb-4">
                  Inizia aggiungendo le prime esperienze locali convenzionate con l'hotel.
                </p>
                <Button onClick={handleNewExperience} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Prima Esperienza
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
