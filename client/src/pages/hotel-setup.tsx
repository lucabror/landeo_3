import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Hotel, Search, MapPin, CheckCircle, AlertCircle, Upload, X, Image, Edit, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { hotelSetupSchema } from "@shared/schema";
import type { HotelSetup } from "@shared/schema";

import { useAuth } from "@/hooks/use-auth";

// Available hotel services
const HOTEL_SERVICES = [
  "Piscina", "Piscina coperta", "Jacuzzi nelle camere", "Jacuzzi pubblica", 
  "SPA", "Centro benessere", "Palestra", "Sauna", "Bagno turco",
  "Ristorante", "Bar", "Room service", "Colazione inclusa", "Parcheggio gratuito",
  "Parcheggio a pagamento", "WiFi gratuito", "Aria condizionata", "Riscaldamento",
  "Reception 24h", "Servizio lavanderia", "Noleggio biciclette", "Servizio navetta",
  "Animazione", "Sale conferenze", "Business center", "Terrazza panoramica",
  "Giardino", "Solarium", "Campo da tennis", "Campo da calcio"
];

export default function HotelSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the user's hotel ID from authentication
  const hotelId = user?.hotelId || user?.id;

  // Fetch existing hotel data
  const { data: hotel, isLoading } = useQuery({
    queryKey: [`/api/hotels/${hotelId}`],
    enabled: !!hotelId,
  });

  console.log("Hotel setup - User:", user);
  console.log("Hotel setup - Hotel ID:", hotelId);
  console.log("Hotel setup - Hotel data:", hotel);

  const form = useForm<HotelSetup>({
    resolver: zodResolver(hotelSetupSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      region: "",
      postalCode: "",
      phone: "",
      email: "",
      website: "",
      description: "",
      logoUrl: "",
      latitude: "",
      longitude: "",
      services: [],
    },
  });

  // Update form when hotel data is loaded
  useEffect(() => {
    if (hotel && typeof hotel === 'object' && 'name' in hotel) {
      // Extract only the fields that belong to the form schema
      const formData = {
        name: (hotel as any).name || '',
        address: (hotel as any).address || '',
        city: (hotel as any).city || '',
        region: (hotel as any).region || '',
        postalCode: (hotel as any).postalCode || '',
        phone: (hotel as any).phone || '',
        email: (hotel as any).email || '',
        website: (hotel as any).website || '',
        description: (hotel as any).description || '',
        logoUrl: (hotel as any).logoUrl || '',
        latitude: (hotel as any).latitude || '',
        longitude: (hotel as any).longitude || '',
        services: Array.isArray((hotel as any).services) ? (hotel as any).services : [],
      };
      
      console.log("🔧 Resetting form with clean data:", formData);
      form.reset(formData);
      
      if ('logoUrl' in hotel && (hotel as any).logoUrl) {
        setLogoPreview((hotel as any).logoUrl as string);
      }
      if ('services' in hotel && Array.isArray((hotel as any).services)) {
        setSelectedServices((hotel as any).services);
      } else {
        setSelectedServices([]);
      }
      // Se ci sono dati hotel, mostra in modalità read-only
      setIsEditing(false);
    } else {
      // Se non ci sono dati, abilita modifica per la creazione
      setIsEditing(true);
      setSelectedServices([]);
    }
  }, [hotel, form]);

  // Geocoding mutation
  const searchHotelMutation = useMutation({
    mutationFn: async ({ name, city, region }: { name: string; city?: string; region?: string }) => {
      const res = await apiRequest("POST", "/api/hotels/geocode", { name, city, region });
      return res.json();
    },
    onSuccess: (data) => {
      // Aggiorna il form con i dati trovati
      form.setValue("name", data.name);
      form.setValue("address", data.address);
      form.setValue("city", data.city);
      form.setValue("region", data.region);
      form.setValue("postalCode", data.postalCode);
      form.setValue("latitude", data.latitude);
      form.setValue("longitude", data.longitude);
      
      if (data.phone) form.setValue("phone", data.phone);
      if (data.website) form.setValue("website", data.website);
      
      setSearchStatus('success');
      setIsSearching(false);
      
      toast({
        title: "Hotel trovato!",
        description: `${data.name} in ${data.city}, ${data.region}`,
      });
    },
    onError: (error: any) => {
      setSearchStatus('error');
      setIsSearching(false);
      
      toast({
        title: "Hotel non trovato",
        description: error.message || "Verifica il nome dell'hotel e riprova",
        variant: "destructive",
      });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: HotelSetup) => {
      const method = hotel ? "PUT" : "POST";
      const url = hotel && typeof hotel === 'object' && 'id' in hotel 
        ? `/api/hotels/${hotel.id}` 
        : "/api/hotels";
      // Include selected services in the data
      const dataWithServices = { ...data, services: selectedServices };
      
      console.log("Mutation - Method:", method);
      console.log("Mutation - URL:", url);
      console.log("Mutation - Data:", dataWithServices);
      
      try {
        const res = await apiRequest(method, url, dataWithServices);
        console.log("Mutation - Response status:", res.status);
        const result = await res.json();
        console.log("Mutation - Response data:", result);
        return result;
      } catch (error) {
        console.error("Mutation - API request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: hotel ? "Dati hotel aggiornati con successo!" : "Hotel creato con successo!",
      });
      // Invalidate the specific hotel query and dashboard queries
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}/setup-status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "stats"] });
      setIsEditing(false); // Torna alla modalità read-only dopo il salvataggio
    },
    onError: (error: any) => {
      console.error("🚨 Mutation error:", error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const handleHotelSearch = () => {
    const hotelName = form.getValues("name");
    if (!hotelName || hotelName.trim() === '') {
      toast({
        title: "Nome richiesto",
        description: "Inserisci il nome dell'hotel per cercarlo",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchStatus('idle');
    
    searchHotelMutation.mutate({
      name: hotelName,
      city: form.getValues("city"),
      region: form.getValues("region")
    });
  };

  // Logo upload mutation
  const logoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Errore durante il caricamento');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      form.setValue('logoUrl', data.logoUrl);
      setLogoPreview(data.logoUrl);
      setIsUploadingLogo(false);
      
      toast({
        title: "Logo caricato!",
        description: "Il logo è stato caricato con successo",
      });
    },
    onError: (error: any) => {
      setIsUploadingLogo(false);
      
      toast({
        title: "Errore caricamento",
        description: error.message || "Errore durante il caricamento del logo",
        variant: "destructive",
      });
    }
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica tipo file
    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg') && !file.type.includes('image/jpg')) {
      toast({
        title: "Formato non supportato",
        description: "Carica solo file PNG o JPG",
        variant: "destructive",
      });
      return;
    }

    // Verifica dimensione (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "Il logo deve essere massimo 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);
    logoUploadMutation.mutate(file);
  };

  const handleLogoRemove = () => {
    setLogoPreview(null);
    form.setValue('logoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: HotelSetup) => {
    console.log("🚀 onSubmit CALLED! Form submitted with data:", data);
    console.log("🚀 Selected services:", selectedServices);
    console.log("🚀 Hotel exists:", !!hotel);
    console.log("🚀 Form validation errors:", form.formState.errors);
    console.log("🚀 Form is valid:", form.formState.isValid);
    
    // Set services to selectedServices to pass validation
    const dataWithServices = { ...data, services: selectedServices };
    console.log("🚀 Data with services:", dataWithServices);
    
    // Check if there are actual errors instead of relying on isValid
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    if (hasErrors) {
      console.error("🚨 Form has validation errors - submission blocked:", form.formState.errors);
      return;
    }
    
    console.log("✅ Form validation passed - proceeding with mutation");
    mutation.mutate(dataWithServices);
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Configurazione Hotel
          </h2>
          <p className="text-gray-600">
            Gestisci le informazioni fondamentali del tuo hotel
          </p>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Hotel className="mr-3 h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl font-serif">
                    {hotel ? "Dati Hotel" : "Configurazione Hotel"}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    I campi contrassegnati con <span className="text-red-500">*</span> sono obbligatori per completare la configurazione
                  </p>
                </div>
              </div>
              {hotel && !isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifica
                </Button>
              )}
              {hotel && isEditing && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset with clean form data
                      if (hotel && typeof hotel === 'object' && 'name' in hotel) {
                        const formData = {
                          name: (hotel as any).name || '',
                          address: (hotel as any).address || '',
                          city: (hotel as any).city || '',
                          region: (hotel as any).region || '',
                          postalCode: (hotel as any).postalCode || '',
                          phone: (hotel as any).phone || '',
                          email: (hotel as any).email || '',
                          website: (hotel as any).website || '',
                          description: (hotel as any).description || '',
                          logoUrl: (hotel as any).logoUrl || '',
                          latitude: (hotel as any).latitude || '',
                          longitude: (hotel as any).longitude || '',
                          services: Array.isArray((hotel as any).services) ? (hotel as any).services : [],
                        };
                        form.reset(formData);
                        if (Array.isArray((hotel as any).services)) {
                          setSelectedServices((hotel as any).services);
                        }
                      }
                    }}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    form="hotel-form"
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
          </CardHeader>
          <CardContent>
            <form 
              id="hotel-form" 
              onSubmit={(e) => {
                console.log("🔥 FORM SUBMIT EVENT TRIGGERED!");
                console.log("🔥 Event:", e);
                console.log("🔥 Form state before submit:", form.formState);
                console.log("🔥 Form errors:", form.formState.errors);
                console.log("🔥 Form values:", form.getValues());
                
                try {
                  return form.handleSubmit(onSubmit)(e);
                } catch (error) {
                  console.error("🚨 Form handleSubmit error:", error);
                  throw error;
                }
              }} 
              className="space-y-6"
            >
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center">
                    Nome Hotel <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Grand Hotel Villa Medici"
                      className={`flex-1 ${form.formState.errors.name ? 'border-red-500' : ''}`}
                      disabled={!isEditing}
                    />
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleHotelSearch}
                        disabled={isSearching}
                        size="sm"
                        className="px-3"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : searchStatus === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : searchStatus === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                  {!isSearching && searchStatus === 'idle' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clicca sul pulsante di ricerca per compilare automaticamente i dati geografici
                    </p>
                  )}
                  {searchStatus === 'success' && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Dati hotel caricati automaticamente
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center">
                    Email <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="info@grandhotel.it"
                    className={`mt-1 ${form.formState.errors.email ? 'border-red-500' : ''}`}
                    disabled={!isEditing}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="flex items-center">
                    Indirizzo *
                    {searchStatus === 'success' && (
                      <MapPin className="h-3 w-3 ml-1 text-green-600" />
                    )}
                  </Label>
                  <Input
                    id="address"
                    {...form.register("address")}
                    placeholder="Via Roma 123"
                    className={`mt-1 ${searchStatus === 'success' ? 'border-green-300 bg-green-50' : ''}`}
                    disabled={!isEditing}
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="flex items-center">
                      Città *
                      {searchStatus === 'success' && (
                        <MapPin className="h-3 w-3 ml-1 text-green-600" />
                      )}
                    </Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      placeholder="Firenze"
                      className={`mt-1 ${searchStatus === 'success' ? 'border-green-300 bg-green-50' : ''}`}
                      disabled={!isEditing}
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="region" className="flex items-center">
                      Regione *
                      {searchStatus === 'success' && (
                        <MapPin className="h-3 w-3 ml-1 text-green-600" />
                      )}
                    </Label>
                    <Input
                      id="region"
                      {...form.register("region")}
                      placeholder="Toscana"
                      className={`mt-1 ${searchStatus === 'success' ? 'border-green-300 bg-green-50' : ''}`}
                      disabled={!isEditing}
                    />
                    {form.formState.errors.region && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.region.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="flex items-center">
                      CAP *
                      {searchStatus === 'success' && (
                        <MapPin className="h-3 w-3 ml-1 text-green-600" />
                      )}
                    </Label>
                    <Input
                      id="postalCode"
                      {...form.register("postalCode")}
                      placeholder="50123"
                      className={`mt-1 ${searchStatus === 'success' ? 'border-green-300 bg-green-50' : ''}`}
                      disabled={!isEditing}
                    />
                    {form.formState.errors.postalCode && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone" className="flex items-center">
                    Telefono <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="+39 055 123456"
                    className={`mt-1 ${form.formState.errors.phone ? 'border-red-500' : ''}`}
                    disabled={!isEditing}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Sito Web</Label>
                  <Input
                    id="website"
                    {...form.register("website")}
                    placeholder="https://www.grandhotel.it"
                    className="mt-1"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Descrizione del hotel..."
                  className="mt-1"
                  rows={4}
                  disabled={!isEditing}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="latitude" className="flex items-center">
                    Latitudine
                    {searchStatus === 'success' && (
                      <MapPin className="h-3 w-3 ml-1 text-green-600" />
                    )}
                  </Label>
                  <Input
                    id="latitude"
                    {...form.register("latitude")}
                    placeholder="43.7696"
                    className={`mt-1 ${searchStatus === 'success' ? 'border-green-300 bg-green-50' : ''}`}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="longitude" className="flex items-center">
                    Longitudine
                    {searchStatus === 'success' && (
                      <MapPin className="h-3 w-3 ml-1 text-green-600" />
                    )}
                  </Label>
                  <Input
                    id="longitude"
                    {...form.register("longitude")}
                    placeholder="11.2558"
                    className={`mt-1 ${searchStatus === 'success' ? 'border-green-300 bg-green-50' : ''}`}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <Label>Logo Hotel</Label>
                <div className="mt-2">
                  {logoPreview ? (
                    <div className="space-y-3">
                      {/* Logo Preview */}
                      <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex-shrink-0">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-16 w-16 object-contain rounded border"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">Logo caricato</p>
                          <p className="text-sm text-gray-500">PNG o JPG, max 5MB</p>
                        </div>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLogoRemove}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Replace Button */}
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="w-full"
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Caricamento...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Sostituisci Logo
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : isEditing ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <div className="space-y-2">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">Carica il logo del tuo hotel</p>
                          <p className="text-sm text-gray-500">PNG o JPG fino a 5MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="mt-2"
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Caricamento...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Seleziona File
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">Nessun logo caricato</p>
                    </div>
                  )}
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Hotel Services */}
              <div>
                <Label className="text-base font-medium mb-2 flex items-center">
                  Servizi Hotel <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Seleziona i servizi offerti dal tuo hotel per personalizzare al meglio le esperienze dei tuoi ospiti.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {HOTEL_SERVICES.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service]);
                          } else {
                            setSelectedServices(selectedServices.filter(s => s !== service));
                          }
                        }}
                        disabled={!isEditing}
                      />
                      <Label 
                        htmlFor={service} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Servizi selezionati:</strong> {selectedServices.join(", ")}
                    </p>
                  </div>
                )}
                {selectedServices.length === 0 && isEditing && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      <strong>Seleziona almeno un servizio</strong> per completare la configurazione dell'hotel.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button - only show when creating new hotel */}
              {!hotel && (
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full md:w-auto bg-primary hover:bg-primary/90"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Crea Hotel
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
