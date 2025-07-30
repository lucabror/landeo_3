import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft,
  Download,
  QrCode,
  Hotel,
  Edit,
  Save,
  X
} from "lucide-react";

export default function ItineraryView() {
  const { uniqueUrl } = useParams<{ uniqueUrl: string }>();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingActivities, setEditingActivities] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is accessing from hotel management (only managers can edit)
  const isManagerView = window.location.search.includes('manager=true') ||
                       document.referrer.includes('/guest-profiles') ||
                       sessionStorage.getItem('isManager') === 'true';

  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ["/api/itinerary", uniqueUrl],
    enabled: !!uniqueUrl,
  });

  // Mutation for updating a day's activities
  const updateDayMutation = useMutation({
    mutationFn: async ({ dayNumber, activities }: { dayNumber: number, activities: any[] }) => {
      // Add manager header to request
      const headers = isManagerView ? { 'x-manager-request': 'true' } : {};
      const response = await apiRequest("PATCH", `/api/itinerary/${uniqueUrl}/day/${dayNumber}?manager=true`, {
        activities
      }, headers);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/itinerary", uniqueUrl] });
      setEditingDay(null);
      setEditingActivities([]);
      toast({
        title: "Giorno aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const handleEditDay = (day: any) => {
    setEditingDay(day.day);
    setEditingActivities([...(day.activities || [])]);
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setEditingActivities([]);
  };

  const handleSaveDay = () => {
    if (editingDay) {
      updateDayMutation.mutate({
        dayNumber: editingDay,
        activities: editingActivities
      });
    }
  };

  const handleActivityChange = (activityIndex: number, field: string, value: string) => {
    const updatedActivities = [...editingActivities];
    updatedActivities[activityIndex] = {
      ...updatedActivities[activityIndex],
      [field]: value
    };
    setEditingActivities(updatedActivities);
  };

  const handleAddActivity = () => {
    const newActivity = {
      time: "09:00",
      activity: "Nuova attività",
      location: "",
      address: "",
      distance: "",
      description: "",
      duration: "1 ora",
      notes: ""
    };
    setEditingActivities([...editingActivities, newActivity]);
  };

  const handleRemoveActivity = (activityIndex: number) => {
    const updatedActivities = editingActivities.filter((_, index) => index !== activityIndex);
    setEditingActivities(updatedActivities);
  };

  const handleDownloadPDF = () => {
    if (uniqueUrl) {
      const downloadUrl = `/api/itinerary/${uniqueUrl}/download-pdf`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleDownloadQR = () => {
    if (uniqueUrl) {
      const downloadUrl = `/api/itinerary/${uniqueUrl}/qr-pdf`;
      window.open(downloadUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento itinerario...</p>
        </div>
      </div>
    );
  }

  // Handle expired itinerary (410 status)
  if (error && error.message.includes('410')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Soggiorno Terminato</h1>
            <p className="text-gray-600 mb-4">
              Questo itinerario non è più accessibile in quanto il periodo di soggiorno è terminato.
            </p>
            <p className="text-sm text-gray-500">
              Grazie per aver scelto la nostra struttura! Speriamo di rivederti presto.
            </p>
          </div>
          <Button onClick={() => window.close()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Chiudi
          </Button>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Itinerario non trovato</h1>
          <p className="text-gray-600 mb-4">L'itinerario richiesto non esiste o non è più disponibile.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna Indietro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4 sm:px-6 sm:py-6">
          {/* Hotel Logo & Title */}
          <div className="flex items-start space-x-3 mb-4">
            {itinerary?.hotel?.logoUrl && (
              <img 
                src={itinerary.hotel.logoUrl} 
                alt={itinerary.hotel.name}
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-serif font-bold text-gray-900 leading-tight">
                {itinerary?.title || 'Itinerario'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {itinerary?.hotel?.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {itinerary?.hotel?.city}, {itinerary?.hotel?.region}
              </p>
            </div>
          </div>

          {/* Manager Actions - Mobile Optimized */}
          {isManagerView && (
            <div className="flex gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handleDownloadQR}>
                <QrCode className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">QR Code</span>
                <span className="sm:hidden">QR</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content - Mobile First */}
      <div className="max-w-full mx-auto px-4 py-4 sm:px-6 sm:py-8">
        {/* Guest Info - Mobile Optimized */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Informazioni Soggiorno
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center">
                <Hotel className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  <strong>Ospite:</strong> {itinerary?.guestProfile?.referenceName || 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  <strong>Persone:</strong> {itinerary?.guestProfile?.numberOfPeople || 'N/A'}
                </span>
              </div>
              <div className="flex items-start">
                <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-1" />
                <div className="text-sm sm:text-base">
                  <strong>Periodo:</strong><br className="sm:hidden" />
                  <span className="block sm:inline sm:ml-1">
                    {itinerary?.guestProfile?.checkInDate ? new Date(itinerary.guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A'} - {itinerary?.guestProfile?.checkOutDate ? new Date(itinerary.guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description - Mobile Optimized */}
        {itinerary?.description && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{itinerary.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Daily Itinerary - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          {itinerary?.days?.map((day: any, index: number) => {
            const isEditing = editingDay === day.day;
            const activitiesToShow = isEditing ? editingActivities : day.activities;
            
            return (
              <Card key={day.day} className="overflow-hidden">
                <CardHeader className="bg-primary/5 pb-3 sm:pb-6">
                  <div className="space-y-3">
                    {/* Day Title - Mobile Stacked */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1 min-w-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
                            Giorno {day.day}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {new Date(day.date).toLocaleDateString('it-IT', { 
                              weekday: 'long', 
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activitiesToShow?.length || 0} attività
                      </Badge>
                    </div>

                    {/* Manager Actions - Mobile Optimized */}
                    {isManagerView && (
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditDay(day)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Modifica</span>
                            <span className="sm:hidden">Modifica</span>
                          </Button>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              onClick={handleSaveDay}
                              disabled={updateDayMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Salva</span>
                              <span className="sm:hidden">Salva</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={updateDayMutation.isPending}
                              className="flex-1 sm:flex-none"
                            >
                              <X className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Annulla</span>
                              <span className="sm:hidden">Annulla</span>
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {activitiesToShow && activitiesToShow.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {activitiesToShow.map((activity: any, actIndex: number) => (
                        <div key={actIndex} className={`p-4 sm:p-6 ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-base sm:text-lg font-medium text-gray-900">Attività {actIndex + 1}</h4>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRemoveActivity(actIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Mobile-First Form - All fields stacked vertically */}
                              <div className="space-y-4">
                                {/* Time and Duration in a flex row on larger screens only */}
                                <div className="flex flex-col sm:flex-row sm:gap-4 space-y-4 sm:space-y-0">
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Orario</label>
                                    <Input 
                                      type="time"
                                      value={activity.time || ""}
                                      onChange={(e) => handleActivityChange(actIndex, 'time', e.target.value)}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durata</label>
                                    <Input 
                                      value={activity.duration || ""}
                                      onChange={(e) => handleActivityChange(actIndex, 'duration', e.target.value)}
                                      placeholder="es. 2 ore"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Attività</label>
                                  <Input 
                                    value={activity.activity || ""}
                                    onChange={(e) => handleActivityChange(actIndex, 'activity', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Località</label>
                                  <Input 
                                    value={activity.location || ""}
                                    onChange={(e) => handleActivityChange(actIndex, 'location', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                                  <Input 
                                    value={activity.address || ""}
                                    onChange={(e) => handleActivityChange(actIndex, 'address', e.target.value)}
                                    placeholder="Via Roma 123, 00100 Roma"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Distanza dal CAP hotel</label>
                                  <Input 
                                    value={activity.distance || ""}
                                    onChange={(e) => handleActivityChange(actIndex, 'distance', e.target.value)}
                                    placeholder="5 km da Assisi"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                                  <Textarea 
                                    value={activity.description || ""}
                                    onChange={(e) => handleActivityChange(actIndex, 'description', e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                  <Textarea 
                                    value={activity.notes || ""}
                                    onChange={(e) => handleActivityChange(actIndex, 'notes', e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Activity Header */}
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base sm:text-lg font-medium text-gray-900 leading-tight">
                                    {activity.activity}
                                  </h4>
                                  <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-1">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span className="font-medium">{activity.time}</span>
                                    {activity.duration && (
                                      <>
                                        <span className="mx-1">•</span>
                                        <span>{activity.duration}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {activity.experienceId && (
                                      <Badge variant="outline" className="text-xs">
                                        Esperienza Locale
                                      </Badge>
                                    )}
                                    {activity.source === 'preference-matched' && (
                                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                        🎯 Scelta sulle tue preferenze
                                      </Badge>
                                    )}
                                    {activity.source === 'hotel-suggested' && (
                                      <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                        🏨 Suggerita dall'hotel
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Activity Details - Mobile Stacked */}
                              <div className="space-y-3">
                                {activity.location && (
                                  <div className="flex items-start space-x-2">
                                    <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600 font-medium">{activity.location}</span>
                                  </div>
                                )}
                                
                                {activity.address && (
                                  <div className="flex items-start space-x-2">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{activity.address}</span>
                                  </div>
                                )}
                                
                                {activity.distance && (
                                  <div className="flex items-start space-x-2">
                                    <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{activity.distance}</span>
                                  </div>
                                )}
                                
                                {activity.description && (
                                  <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                    {activity.description}
                                  </div>
                                )}
                                
                                {activity.notes && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs sm:text-sm text-blue-800">
                                      <strong>Note:</strong> {activity.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Activity Button - Mobile Optimized */}
                    {isEditing && (
                      <div className="p-4 sm:p-6 bg-gray-50">
                        <Button 
                          variant="outline" 
                          onClick={handleAddActivity}
                          className="w-full"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Aggiungi Attività
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isEditing ? (
                  <div className="p-6 bg-gray-50">
                    <div className="text-center text-gray-500 mb-4">
                      Nessuna attività programmata per questo giorno
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleAddActivity}
                      className="w-full"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Aggiungi Attività
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Nessuna attività programmata per questo giorno
                  </div>
                )}
              </CardContent>
            </Card>
            );
          }) || (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun itinerario disponibile</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 mb-4">
              Questo itinerario è stato generato appositamente per la vostra esperienza presso <strong>{itinerary?.hotel?.name || 'il nostro hotel'}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Per informazioni o modifiche, contattate la reception dell'hotel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}