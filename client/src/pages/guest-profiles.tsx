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
  Loader2,
  CheckCircle,
  Clock,
  Save
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
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditingInView, setIsEditingInView] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
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
      const isEditing = editingProfile || (isViewMode && isEditingInView);
      const method = isEditing ? "PUT" : "POST";
      const profileId = editingProfile?.id || viewingProfile?.id;
      const url = isEditing ? `/api/guest-profiles/${profileId}` : "/api/guest-profiles";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      const isEditing = editingProfile || (isViewMode && isEditingInView);
      toast({
        title: "Successo",
        description: isEditing ? "Profilo aggiornato con successo!" : "Profilo creato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", MOCK_HOTEL_ID, "guest-profiles"] });
      setIsDialogOpen(false);
      setEditingProfile(null);
      setViewingProfile(null);
      setIsViewMode(false);
      setIsEditingInView(false);
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

  const handleView = (profile: any) => {
    setViewingProfile(profile);
    setIsViewMode(true);
    setIsEditingInView(false);
    form.reset({
      ...profile,
      checkInDate: new Date(profile.checkInDate),
      checkOutDate: new Date(profile.checkOutDate),
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    setIsViewMode(false);
    form.reset({
      ...profile,
      checkInDate: new Date(profile.checkInDate),
      checkOutDate: new Date(profile.checkOutDate),
    });
    setIsDialogOpen(true);
  };

  const handleEditInView = () => {
    setIsEditingInView(true);
  };

  const handleCancelEditInView = () => {
    setIsEditingInView(false);
    if (viewingProfile) {
      form.reset({
        ...viewingProfile,
        checkInDate: new Date(viewingProfile.checkInDate),
        checkOutDate: new Date(viewingProfile.checkOutDate),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo profilo ospite?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleResendEmail = async (profile: any) => {
    try {
      await apiRequest("POST", `/api/hotels/${MOCK_HOTEL_ID}/guest-profiles/${profile.id}/resend-email`);
      
      toast({ 
        title: "Email re-inviata", 
        description: `Email di preferenze re-inviata a ${profile.email}` 
      });
    } catch (error: any) {
      toast({ 
        title: "Errore nell'invio email", 
        description: error.message || "Si è verificato un errore durante l'invio dell'email",
        variant: "destructive" 
      });
    }
  };

  const handleNewProfile = () => {
    setEditingProfile(null);
    setViewingProfile(null);
    setIsViewMode(false);
    setIsEditingInView(false);
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
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center font-heading text-xl">
                    <Users className="mr-2 h-5 w-5" />
                    {isViewMode && !isEditingInView 
                      ? "Profilo Ospite" 
                      : editingProfile || isEditingInView 
                        ? "Modifica Profilo Ospite" 
                        : "Nuovo Profilo Ospite"
                    }
                  </DialogTitle>
                  {isViewMode && !isEditingInView && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEditInView}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Modifica
                    </Button>
                  )}
                  {isViewMode && isEditingInView && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEditInView}
                      >
                        Annulla
                      </Button>
                      <Button
                        type="submit"
                        form="profile-form"
                        disabled={mutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {mutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salva
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>
              
              {isViewMode && !isEditingInView ? (
                // Read-only view
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Informazioni Base
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Tipo Ospite</Label>
                        <p className="text-sm mt-1">{getTypeLabel(viewingProfile?.type || "")}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Numero Persone</Label>
                        <p className="text-sm mt-1">{viewingProfile?.numberOfPeople}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Nome di Riferimento</Label>
                        <p className="text-sm mt-1">{viewingProfile?.referenceName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="text-sm mt-1">{viewingProfile?.email || "Non specificata"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Lingua Email</Label>
                        <p className="text-sm mt-1">
                          {viewingProfile?.emailLanguage === 'en' ? '🇬🇧 English' : '🇮🇹 Italiano'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Camera</Label>
                        <p className="text-sm mt-1">{viewingProfile?.roomNumber || "Non assegnata"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stay Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Periodo di Soggiorno
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Check-in</Label>
                        <p className="text-sm mt-1">
                          {viewingProfile?.checkInDate ? new Date(viewingProfile.checkInDate).toLocaleDateString('it-IT') : "Non specificato"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Check-out</Label>
                        <p className="text-sm mt-1">
                          {viewingProfile?.checkOutDate ? new Date(viewingProfile.checkOutDate).toLocaleDateString('it-IT') : "Non specificato"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Guest Preferences */}
                  {viewingProfile?.preferences && viewingProfile.preferences.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Heart className="h-5 w-5 mr-2" />
                        Preferenze Raccolte
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.preferences.map((pref: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {viewingProfile?.specialRequests && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Richieste Speciali</h3>
                      <p className="text-sm">{viewingProfile.specialRequests}</p>
                    </div>
                  )}

                  {/* Preferences Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Stato Preferenze</h3>
                    <div className="flex items-center gap-2">
                      {viewingProfile?.preferencesCompleted ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Preferenze raccolte</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="text-sm text-orange-700 font-medium">In attesa preferenze</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit form
                <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              )}
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
                <Card key={profile.id} className="relative hover:shadow-md transition-all duration-200 border border-slate-200 bg-white">
                  <CardContent className="p-4">
                    {/* Action Buttons - Top Right */}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(profile)}
                        className="h-6 w-6 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(profile.id)}
                        className="h-6 w-6 p-0 rounded-full hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex items-start space-x-3 pr-14 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-heading font-semibold text-slate-900 truncate mb-2">
                          {profile.referenceName}
                        </h3>
                        
                        {/* Stay Status */}
                        {(() => {
                          const today = new Date();
                          const checkIn = new Date(profile.checkInDate);
                          const checkOut = new Date(profile.checkOutDate);
                          const isCurrentlyStaying = today >= checkIn && today <= checkOut;
                          const hasCheckedOut = today > checkOut;
                          const isUpcoming = today < checkIn;
                          
                          if (isCurrentlyStaying) {
                            return (
                              <div className="flex items-center space-x-1 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-700 font-medium">Presente in hotel</span>
                              </div>
                            );
                          } else if (hasCheckedOut) {
                            return (
                              <div className="flex items-center space-x-1 mb-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-xs text-gray-600 font-medium">Check-out completato</span>
                              </div>
                            );
                          } else if (isUpcoming) {
                            return (
                              <div className="flex items-center space-x-1 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-blue-700 font-medium">Arrivo previsto</span>
                              </div>
                            );
                          }
                        })()}
                        
                        {/* Preferences Status */}
                        {profile.preferencesCompleted ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Preferenze completate</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span className="text-xs text-orange-700 font-medium">In attesa preferenze</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Buttons */}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full font-medium"
                        onClick={() => handleView(profile)}
                      >
                        Vedi Profilo
                      </Button>
                      
                      {!profile.preferencesCompleted && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full font-medium bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleResendEmail(profile)}
                        >
                          Re-invia Email
                        </Button>
                      )}
                    </div>
                  </CardContent>
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
