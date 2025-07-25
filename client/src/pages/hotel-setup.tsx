import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Hotel } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertHotelSchema } from "@shared/schema";
import type { InsertHotel } from "@shared/schema";

// Mock hotel ID - in real app this would come from auth/context
const MOCK_HOTEL_ID = "hotel-1";

export default function HotelSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing hotel data
  const { data: hotel, isLoading } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID],
  });

  const form = useForm<InsertHotel>({
    resolver: zodResolver(insertHotelSchema),
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
    },
  });

  // Update form when hotel data is loaded
  useState(() => {
    if (hotel) {
      form.reset(hotel);
    }
  }, [hotel]);

  const mutation = useMutation({
    mutationFn: async (data: InsertHotel) => {
      const method = hotel ? "PUT" : "POST";
      const url = hotel ? `/api/hotels/${hotel.id}` : "/api/hotels";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: hotel ? "Dati hotel aggiornati con successo!" : "Hotel creato con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertHotel) => {
    mutation.mutate(data);
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
            <div className="flex items-center">
              <Hotel className="mr-3 h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-serif">
                {hotel ? "Modifica Dati Hotel" : "Nuovo Hotel"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Nome Hotel *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Grand Hotel Villa Medici"
                    className="mt-1"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="info@grandhotel.it"
                    className="mt-1"
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
                  <Label htmlFor="address">Indirizzo *</Label>
                  <Input
                    id="address"
                    {...form.register("address")}
                    placeholder="Via Roma 123"
                    className="mt-1"
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Città *</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      placeholder="Firenze"
                      className="mt-1"
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="region">Regione *</Label>
                    <Input
                      id="region"
                      {...form.register("region")}
                      placeholder="Toscana"
                      className="mt-1"
                    />
                    {form.formState.errors.region && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.region.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="postalCode">CAP *</Label>
                    <Input
                      id="postalCode"
                      {...form.register("postalCode")}
                      placeholder="50123"
                      className="mt-1"
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
                  <Label htmlFor="phone">Telefono *</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="+39 055 123456"
                    className="mt-1"
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
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="latitude">Latitudine</Label>
                  <Input
                    id="latitude"
                    {...form.register("latitude")}
                    placeholder="43.7696"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">Longitudine</Label>
                  <Input
                    id="longitude"
                    {...form.register("longitude")}
                    placeholder="11.2558"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">URL Logo</Label>
                <Input
                  id="logoUrl"
                  {...form.register("logoUrl")}
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                />
              </div>

              {/* Submit Button */}
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
                      {hotel ? "Aggiorna Hotel" : "Crea Hotel"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
