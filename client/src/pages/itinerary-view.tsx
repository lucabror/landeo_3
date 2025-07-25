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
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {itinerary?.hotel?.logoUrl && (
                <img 
                  src={itinerary.hotel.logoUrl} 
                  alt={itinerary.hotel.name}
                  className="h-12 w-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">{itinerary?.title || 'Itinerario'}</h1>
                <p className="text-gray-600">
                  {itinerary?.hotel?.name} • {itinerary?.hotel?.city}, {itinerary?.hotel?.region}
                </p>
              </div>
            </div>
            {isManagerView && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Code
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Guest Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Informazioni Soggiorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Hotel className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  <strong>Ospite:</strong> {itinerary?.guestProfile?.referenceName || 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  <strong>Persone:</strong> {itinerary?.guestProfile?.numberOfPeople || 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  <strong>Periodo:</strong> {itinerary?.guestProfile?.checkInDate ? new Date(itinerary.guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A'} - {itinerary?.guestProfile?.checkOutDate ? new Date(itinerary.guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {itinerary?.description && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-gray-700">{itinerary.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Daily Itinerary */}
        <div className="space-y-6">
          {itinerary?.days?.map((day: any, index: number) => {
            const isEditing = editingDay === day.day;
            const activitiesToShow = isEditing ? editingActivities : day.activities;
            
            return (
              <Card key={day.day} className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Giorno {day.day} - {new Date(day.date).toLocaleDateString('it-IT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {activitiesToShow?.length || 0} attività
                      </Badge>
                      {isManagerView && (
                        !isEditing ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditDay(day)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                        ) : (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              onClick={handleSaveDay}
                              disabled={updateDayMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salva
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={updateDayMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Annulla
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              <CardContent className="p-0">
                {activitiesToShow && activitiesToShow.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {activitiesToShow.map((activity: any, actIndex: number) => (
                      <div key={actIndex} className={`p-6 ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-medium text-gray-900">Attività {actIndex + 1}</h4>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRemoveActivity(actIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Orario</label>
                                <Input 
                                  type="time"
                                  value={activity.time || ""}
                                  onChange={(e) => handleActivityChange(actIndex, 'time', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Durata</label>
                                <Input 
                                  value={activity.duration || ""}
                                  onChange={(e) => handleActivityChange(actIndex, 'duration', e.target.value)}
                                  placeholder="es. 2 ore"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">Nome Attività</label>
                              <Input 
                                value={activity.activity || ""}
                                onChange={(e) => handleActivityChange(actIndex, 'activity', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">Località</label>
                              <Input 
                                value={activity.location || ""}
                                onChange={(e) => handleActivityChange(actIndex, 'location', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">Descrizione</label>
                              <Textarea 
                                value={activity.description || ""}
                                onChange={(e) => handleActivityChange(actIndex, 'description', e.target.value)}
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">Note</label>
                              <Textarea 
                                value={activity.notes || ""}
                                onChange={(e) => handleActivityChange(actIndex, 'notes', e.target.value)}
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-lg font-medium text-gray-900 mb-1">
                                    {activity.activity}
                                  </h4>
                                  <div className="flex items-center text-sm text-gray-500 mb-2">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span className="font-medium">{activity.time}</span>
                                    {activity.duration && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>{activity.duration}</span>
                                      </>
                                    )}
                                  </div>
                                  {activity.location && (
                                    <div className="flex items-center text-sm text-gray-500 mb-3">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      <span>{activity.location}</span>
                                    </div>
                                  )}
                                  <p className="text-gray-700 mb-3">{activity.description}</p>
                                  {activity.notes && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> {activity.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {activity.experienceId && (
                                  <Badge variant="outline" className="ml-4">
                                    Esperienza Locale
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isEditing && (
                      <div className="p-6 bg-gray-50">
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