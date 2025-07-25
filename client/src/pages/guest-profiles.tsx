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
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-2">
              Profili Ospiti
            </h2>
            <p className="text-slate-600 font-sans">
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
                <DialogTitle className="flex items-center font-heading text-xl">
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
                <Card key={profile.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white">
                  {/* Card Header */}
                  <div className="relative p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    {/* Action Buttons - Top Right */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(profile)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(profile.id)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Guest Info */}
                    <div className="flex items-start space-x-4 pr-20">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                        <TypeIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-semibold text-slate-900 mb-1">
                          {profile.referenceName}
                        </h3>
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs">
                            {getTypeLabel(profile.type)}
                          </Badge>
                          <span className="text-sm text-slate-600 font-medium">
                            {profile.numberOfPeople} persona{profile.numberOfPeople > 1 ? 'e' : 'a'}
                          </span>
                        </div>
                        
                        {/* Status Badge */}
                        {profile.preferencesCompleted ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                            ✓ Preferenze completate
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
                            ⏳ In attesa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <CardContent className="p-6 space-y-4">
                    {/* Dates and Room */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(profile.checkInDate).toLocaleDateString("it-IT")} - {new Date(profile.checkOutDate).toLocaleDateString("it-IT")}
                          </p>
                          <p className="text-xs text-slate-600">Date soggiorno</p>
                        </div>
                      </div>
                      {profile.roomNumber && (
                        <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                          <p className="text-sm font-display font-semibold text-slate-700">Camera {profile.roomNumber}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Active Guest Banner */}
                    {new Date() >= new Date(profile.checkInDate) && 
                     new Date() <= new Date(profile.checkOutDate) && (
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-green-800 font-medium text-sm">🏨 Ospite presente in hotel</p>
                      </div>
                    )}
                    
                    {/* Special Requests */}
                    {profile.specialRequests && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl p-4">
                        <p className="text-sm text-blue-900">
                          <span className="font-semibold">Richieste speciali:</span>
                        </p>
                        <p className="text-sm text-blue-800 mt-1">{profile.specialRequests}</p>
                      </div>
                    )}
                    
                    {/* Preferences */}
                    {profile.preferencesCompleted && profile.preferences && profile.preferences.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-emerald-900 mb-3 flex items-center">
                          🎯 Preferenze di viaggio ({profile.preferences.length})
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {profile.preferences.slice(0, 3).map((pref: string, index: number) => (
                            <div key={index} className="bg-white border border-emerald-200 rounded-lg px-3 py-2">
                              <span className="text-xs font-medium text-emerald-800">{pref}</span>
                            </div>
                          ))}
                          {profile.preferences.length > 3 && (
                            <div className="bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 text-center">
                              <span className="text-xs font-medium text-emerald-800">
                                +{profile.preferences.length - 3} altre preferenze
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Card Footer */}
                  <div className="px-6 pb-4">
                    <div className="text-center border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500 font-display">
                        Creato il {new Date(profile.createdAt).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
            
            {(!guestProfiles || guestProfiles.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-heading font-medium text-slate-900 mb-2">
                  Nessun profilo ospite
                </h3>
                <p className="text-slate-500 mb-4 font-sans">
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
