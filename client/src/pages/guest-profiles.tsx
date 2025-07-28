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
  Save,
  Route,
  Eye,
  QrCode,
  Mail,
  CreditCard
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CreditPurchaseDialog from "@/components/credit-purchase-dialog";
import { insertGuestProfileSchema } from "@shared/schema";
import type { InsertGuestProfile } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

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
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Delete itinerary mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/itineraries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Itinerario eliminato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "itineraries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const handleDeleteItinerary = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo itinerario?")) {
      deleteItineraryMutation.mutate(id);
    }
  };
  
  // Get hotel ID from authenticated user
  const hotelId = user?.hotelId;
  
  if (!hotelId) {
    return <div>Errore: ID hotel non trovato</div>;
  }

  // Fetch guest profiles with itineraries
  const { data: guestProfiles, isLoading } = useQuery({
    queryKey: ["/api/hotels", hotelId, "guest-profiles"],
  });

  // Fetch guest-specific itinerary when viewing profile
  const { data: guestItinerary } = useQuery({
    queryKey: ["/api/guest-profiles", viewingProfile?.id, "itinerary"],
    enabled: !!viewingProfile?.id,
  });

  // Fetch hotel credits with auto-refresh
  const { data: creditInfo = { credits: 0, totalCredits: 0, creditsUsed: 0 } } = useQuery({
    queryKey: ["/api/hotels", hotelId, "credits"],
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });
  
  // Type assertion for creditInfo to avoid TypeScript errors
  const credits = (creditInfo as any).credits || 0;

  // Fetch all itineraries for current guest profile
  const { data: allItineraries = [] } = useQuery({
    queryKey: ["/api/hotels", hotelId, "itineraries"],
  });

  const form = useForm<InsertGuestProfile>({
    resolver: zodResolver(insertGuestProfileSchema),
    defaultValues: {
      hotelId: hotelId,
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
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "guest-profiles"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "guest-profiles"] });
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
    deleteMutation.mutate(id);
  };

  const handleResendEmail = async (profile: any) => {
    try {
      await apiRequest("POST", `/api/hotels/${hotelId}/guest-profiles/${profile.id}/resend-email`);
      
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

  const handleGenerateItinerary = async (profile: any) => {
    try {
      setIsGeneratingItinerary(true);
      
      toast({
        title: "Generazione in corso",
        description: "Sto generando l'itinerario personalizzato... Questo processo può richiedere alcuni minuti.",
        duration: 5000,
      });

      const response = await apiRequest("POST", `/api/guest-profiles/${profile.id}/generate-itinerary`);
      
      // Immediatamente dopo la generazione, invalida le cache per aggiornare i crediti
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guest-profiles", profile.id, "itinerary"] });
      
      // Refresh all related data to immediately show the new itinerary
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "guest-profiles"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "itineraries"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/guest-profiles", profile.id, "itinerary"] }),
      ]);
      
      toast({
        title: "Itinerario generato",
        description: "L'itinerario personalizzato è stato creato con successo!",
      });
    } catch (error: any) {
      toast({
        title: "Errore generazione itinerario",
        description: error.message || "Si è verificato un errore durante la generazione dell'itinerario",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const handleEmailPDF = async (itinerary: any, profile: any) => {
    try {
      const email = profile.email || prompt("Inserisci l'email dell'ospite:");
      if (!email) return;

      const result = await apiRequest("POST", `/api/itinerary/${itinerary.uniqueUrl}/email-pdf`, {
        recipientEmail: email,
        recipientName: profile.referenceName
      });

      toast({
        title: "Email inviata",
        description: "L'itinerario PDF è stato inviato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'invio dell'email",
        variant: "destructive",
      });
    }
  };

  const handleNewProfile = () => {
    setEditingProfile(null);
    setViewingProfile(null);
    setIsViewMode(false);
    setIsEditingInView(false);
    form.reset({
      hotelId: hotelId,
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
          
          <CreditPurchaseDialog hotelId={hotelId} currentCredits={credits}>
            <Button className="bg-green-600 hover:bg-green-700">
              <CreditCard className="mr-2 h-4 w-4" />
              Crediti: {credits}
            </Button>
          </CreditPurchaseDialog>
        </div>

        {/* Credit Warning */}
        {credits <= 5 && (
          <Card className="bg-orange-50 border-orange-200 mb-8">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Crediti in esaurimento</h3>
                  <p className="text-sm text-orange-700">
                    Hai solo {credits} crediti rimasti. Ogni nuovo ospite costa 1 credito.
                  </p>
                </div>
              </div>
              <CreditPurchaseDialog hotelId={hotelId} currentCredits={credits}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Acquista Crediti
                </Button>
              </CreditPurchaseDialog>
            </CardContent>
          </Card>
        )}

        <div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewProfile} className="bg-primary hover:bg-primary/90 mt-[20px] mb-[20px]">
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

                  {/* All Itineraries for this Guest */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Route className="h-5 w-5 mr-2" />
                      Itinerari Generati
                    </h3>
                    {(() => {
                      // Filter itineraries for this guest and sort by creation date (newest first)
                      const guestItineraries = (allItineraries as any)?.filter((itinerary: any) => 
                        itinerary.guestProfileId === viewingProfile.id
                      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
                      
                      if (guestItineraries.length > 0) {
                        return (
                        <div className="space-y-4">
                          {guestItineraries.map((itinerary: any, index: number) => {
                            const isExpired = new Date() > new Date(viewingProfile.checkOutDate);
                            const isNewest = index === 0;
                            
                            return (
                              <div key={itinerary.id} className={`bg-white p-4 rounded-lg border ${isNewest ? 'border-purple-300 shadow-sm' : 'border-gray-200'}`}>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-base font-medium text-gray-900">
                                        {itinerary.title}
                                      </h4>
                                      {isNewest && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          Più Recente
                                        </Badge>
                                      )}
                                      {isExpired && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                                          Itinerario Scaduto
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {new Date(viewingProfile.checkInDate).toLocaleDateString('it-IT')} - {new Date(viewingProfile.checkOutDate).toLocaleDateString('it-IT')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Generato il {new Date(itinerary.createdAt).toLocaleDateString('it-IT')} alle {new Date(itinerary.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                    {itinerary.days?.length || 1} giorni
                                  </Badge>
                                </div>
                                
                                <Button 
                                  className="w-full bg-purple-600 hover:bg-purple-700 mb-3"
                                  onClick={() => {
                                    // Set manager flag before navigation
                                    sessionStorage.setItem('isManager', 'true');
                                    window.open(`/itinerary/${itinerary.uniqueUrl}?manager=true`, '_blank');
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Vedi Itinerario
                                </Button>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    disabled={isExpired}
                                    onClick={() => {
                                      if (isExpired) {
                                        toast({
                                          title: "QR Code non disponibile",
                                          description: "Il soggiorno è terminato e il QR code non è più accessibile.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      window.open(`/api/itinerary/${itinerary.uniqueUrl}/qr-pdf`, '_blank');
                                    }}
                                  >
                                    <QrCode className="h-4 w-4 mr-1" />
                                    QR Code PDF
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleEmailPDF(itinerary, viewingProfile)}
                                  >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email PDF
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteItinerary(itinerary.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full text-purple-600 hover:bg-purple-100"
                              onClick={() => handleGenerateItinerary(viewingProfile)}
                              disabled={creditInfo.credits <= 0 || isGeneratingItinerary}
                            >
                              {isGeneratingItinerary ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Generando...
                                </>
                              ) : (
                                <>
                                  <Route className="h-4 w-4 mr-1" />
                                  Rigenera Itinerario
                                </>
                              )}
                            </Button>
                            {creditInfo.credits <= 0 && !isGeneratingItinerary && (
                              <p className="text-xs text-center text-orange-600">
                                <a href="/admin-dashboard" className="underline hover:text-orange-800">
                                  Acquista Crediti
                                </a> per Generare l'Itinerario
                              </p>
                            )}
                            {isGeneratingItinerary && (
                              <p className="text-xs text-center text-blue-600">
                                La generazione può richiedere alcuni minuti...
                              </p>
                            )}
                          </div>
                        </div>
                        );
                      } else {
                        return (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-600 mb-3">
                              Nessun itinerario generato per questo ospite
                            </p>
                            <Button 
                              onClick={() => handleGenerateItinerary(viewingProfile)}
                              disabled={!viewingProfile?.preferencesCompleted || creditInfo.credits <= 0 || isGeneratingItinerary}
                              className="bg-purple-600 hover:bg-purple-700 mt-[20px] mb-[20px]"
                            >
                              {isGeneratingItinerary ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generando Itinerario...
                                </>
                              ) : (
                                <>
                                  <Route className="h-4 w-4 mr-2" />
                                  Genera Itinerario AI
                                </>
                              )}
                            </Button>
                            {!viewingProfile?.preferencesCompleted && !isGeneratingItinerary && (
                              <p className="text-xs text-orange-600 mt-2">
                                Le preferenze dell'ospite devono essere raccolte prima di generare l'itinerario
                              </p>
                            )}
                            {viewingProfile?.preferencesCompleted && creditInfo.credits <= 0 && !isGeneratingItinerary && (
                              <p className="text-xs text-orange-600 mt-2">
                                <a href="/admin-dashboard" className="underline hover:text-orange-800">
                                  Acquista Crediti
                                </a> per Generare l'Itinerario
                              </p>
                            )}
                            {isGeneratingItinerary && (
                              <p className="text-xs text-blue-600 mt-2">
                                La generazione dell'itinerario può richiedere alcuni minuti. Attendere prego...
                              </p>
                            )}
                          </div>
                        );
                      }
                    })()}
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
            {(guestProfiles as any)?.map((profile: any) => {
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 rounded-full hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminare il profilo ospite?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questa azione non può essere annullata. Il profilo ospite e tutti i dati associati verranno eliminati definitivamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(profile.id)} className="bg-red-600 hover:bg-red-700">
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
            
            {(!(guestProfiles as any) || (guestProfiles as any).length === 0) && (
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
