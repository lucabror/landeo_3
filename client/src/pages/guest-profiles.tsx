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
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Heart,
  Briefcase,
  UserCheck,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertGuestProfileSchema } from "@shared/schema";
import type { InsertGuestProfile } from "@shared/schema";

// Mock hotel ID - in real app this would come from auth/context
const MOCK_HOTEL_ID = "d2dd46f0-97d3-4121-96e3-01500370c73f";

const GUEST_TYPES = [
  { value: "famiglia", label: "Famiglia", icon: Users },
  { value: "coppia", label: "Coppia", icon: Heart },
  { value: "singolo", label: "Singolo", icon: User },
  { value: "gruppo_lavoro", label: "Gruppo di Lavoro", icon: Briefcase },
  { value: "anziani", label: "Anziani", icon: UserCheck },
];

export default function GuestProfiles() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch guest profiles
  const { data: guestProfiles, isLoading } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID, "guest-profiles"],
  });

  const form = useForm<InsertGuestProfile>({
    resolver: zodResolver(insertGuestProfileSchema),
    defaultValues: {
      hotelId: MOCK_HOTEL_ID,
      type: "",
      numberOfPeople: 1,
      referenceName: "",
      email: "",
      emailLanguage: "it",
      ages: [],
      preferences: [],
      specialRequests: "",
      checkInDate: new Date(),
      checkOutDate: new Date(),
      roomNumber: "",
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertGuestProfile) => {
      const method = editingProfile ? "PUT" : "POST";
      const url = editingProfile ? `/api/guest-profiles/${editingProfile.id}` : "/api/guest-profiles";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: editingProfile ? "Profilo aggiornato con successo!" : "Profilo creato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", MOCK_HOTEL_ID, "guest-profiles"] });
      setIsDialogOpen(false);
      setEditingProfile(null);
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
      await apiRequest("DELETE", `/api/guest-profiles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Profilo eliminato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", MOCK_HOTEL_ID, "guest-profiles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGuestProfile) => {
    // Ensure dates are properly formatted
    const formattedData = {
      ...data,
      checkInDate: new Date(data.checkInDate),
      checkOutDate: new Date(data.checkOutDate),
    };
    mutation.mutate(formattedData);
  };

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    form.reset({
      ...profile,
      checkInDate: new Date(profile.checkInDate),
      checkOutDate: new Date(profile.checkOutDate),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo profilo ospite?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewProfile = () => {
    setEditingProfile(null);
    form.reset({
      hotelId: MOCK_HOTEL_ID,
      type: "",
      numberOfPeople: 1,
      referenceName: "",
      email: "",
      emailLanguage: "it",
      ages: [],
      preferences: [],
      specialRequests: "",
      checkInDate: new Date(),
      checkOutDate: new Date(),
      roomNumber: "",
    });
    setIsDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = GUEST_TYPES.find(t => t.value === type);
    return typeConfig?.icon || User;
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = GUEST_TYPES.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Profili Ospiti
            </h2>
            <p className="text-gray-600">
              Gestisci i profili degli ospiti per personalizzare le loro esperienze
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewProfile} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuovo Profilo
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  {editingProfile ? "Modifica Profilo Ospite" : "Nuovo Profilo Ospite"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo Ospite *</Label>
                    <Select 
                      value={form.watch("type")} 
                      onValueChange={(value) => form.setValue("type", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {GUEST_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="numberOfPeople">Numero Persone *</Label>
                    <Input
                      id="numberOfPeople"
                      type="number"
                      min="1"
                      {...form.register("numberOfPeople", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="referenceName">Nome di Riferimento *</Label>
                  <Input
                    id="referenceName"
                    {...form.register("referenceName")}
                    placeholder="Mario Rossi"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Ospite</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="email@esempio.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emailLanguage">Lingua Email</Label>
                    <Select
                      value={form.watch("emailLanguage") || "it"}
                      onValueChange={(value) => form.setValue("emailLanguage", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Lingua email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Se inserita, l'ospite riceverà automaticamente un'email nella lingua selezionata con un modulo per specificare le sue preferenze di viaggio
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInDate">Check-in *</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={form.watch("checkInDate") ? new Date(form.watch("checkInDate")).toISOString().split('T')[0] : ''}
                      onChange={(e) => form.setValue("checkInDate", new Date(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="checkOutDate">Check-out *</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={form.watch("checkOutDate") ? new Date(form.watch("checkOutDate")).toISOString().split('T')[0] : ''}
                      onChange={(e) => form.setValue("checkOutDate", new Date(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="roomNumber">Numero Camera</Label>
                  <Input
                    id="roomNumber"
                    {...form.register("roomNumber")}
                    placeholder="205"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="specialRequests">Richieste Speciali</Label>
                  <Textarea
                    id="specialRequests"
                    {...form.register("specialRequests")}
                    placeholder="Allergie, preferenze alimentari, esigenze particolari..."
                    className="mt-1"
                    rows={3}
                  />
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
                      editingProfile ? "Aggiorna" : "Crea Profilo"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Guest Profiles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guestProfiles?.map((profile: any) => {
              const TypeIcon = getTypeIcon(profile.type);
              return (
                <Card key={profile.id} className="card-hover shadow-sm border-gray-200 hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-sm">
                          <TypeIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-serif text-gray-900 mb-1">
                            {profile.referenceName}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                              {getTypeLabel(profile.type)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {profile.numberOfPeople} persona{profile.numberOfPeople > 1 ? 'e' : 'a'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {profile.preferencesCompleted ? (
                              <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                ✓ Preferenze complete
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                ⏳ In attesa risposta
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(profile)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(profile.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4 space-y-4">
                    {/* Date e Camera */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">
                          {new Date(profile.checkInDate).toLocaleDateString("it-IT")} - {" "}
                          {new Date(profile.checkOutDate).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                      {profile.roomNumber && (
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                          <span className="font-medium">Camera {profile.roomNumber}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status attivo */}
                    {new Date() >= new Date(profile.checkInDate) && 
                     new Date() <= new Date(profile.checkOutDate) && (
                      <div className="flex items-center justify-center py-2 bg-green-50 rounded-lg border border-green-200">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                          🏨 Ospite presente
                        </Badge>
                      </div>
                    )}
                    
                    {/* Richieste speciali */}
                    {profile.specialRequests && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">📝 Richieste:</span> {profile.specialRequests}
                        </p>
                      </div>
                    )}
                    
                    {/* Preferenze */}
                    {profile.preferencesCompleted && profile.preferences && profile.preferences.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                          🎯 Preferenze di viaggio
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.preferences.slice(0, 4).map((pref: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs bg-white border-emerald-300 text-emerald-700">
                              {pref}
                            </Badge>
                          ))}
                          {profile.preferences.length > 4 && (
                            <Badge variant="outline" className="text-xs bg-emerald-100 border-emerald-300 text-emerald-700">
                              +{profile.preferences.length - 4} altre
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 text-center">
                      Creato il {new Date(profile.createdAt).toLocaleDateString("it-IT")}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {(!guestProfiles || guestProfiles.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun profilo ospite
                </h3>
                <p className="text-gray-500 mb-4">
                  Inizia creando il primo profilo ospite per personalizzare le esperienze.
                </p>
                <Button onClick={handleNewProfile} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Crea Primo Profilo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
