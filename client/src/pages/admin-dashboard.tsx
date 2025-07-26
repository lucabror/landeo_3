import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building, CreditCard, Euro, AlertCircle, CheckCircle, X, Settings, Search, Eye, Mail, Phone, MapPin, Calendar, Trash2, User, LogOut } from "lucide-react";
import { Link } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute, useAuth } from "@/hooks/use-auth";

interface Hotel {
  id: string;
  name: string;
  city: string;
  region: string;
  phone: string;
  email: string;
  credits: number;
  totalCredits?: number;
  createdAt: string;
}

interface CreditPurchase {
  id: string;
  hotelId: string;
  packageType: string;
  packagePrice: number;
  creditsAmount: number;
  status: string;
  createdAt: string;
  hotel: Hotel;
}

const ADMIN_EMAIL = "itinera1prova@gmail.com";
const ADMIN_PASSWORD = "admin2025";

function AdminDashboardContent() {
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [creditAdjustment, setCreditAdjustment] = useState({ amount: 0, description: "" });
  const [processingNotes, setProcessingNotes] = useState("");
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hotelDetailModal, setHotelDetailModal] = useState(false);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  // Fetch all hotels
  const { data: hotels = [], isLoading: hotelsLoading } = useQuery({
    queryKey: ["/api/admin/hotels"],
  });

  // Fetch pending purchases
  const { data: pendingPurchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/admin/pending-purchases"],
  });

  // Approve purchase mutation
  const approveMutation = useMutation({
    mutationFn: async ({ purchaseId, notes }: { purchaseId: string; notes: string }) => {
      return apiRequest("POST", `/api/admin/purchases/${purchaseId}/approve`, {
        adminEmail: ADMIN_EMAIL, 
        notes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setProcessingNotes("");
    },
  });

  // Reject purchase mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ purchaseId, notes }: { purchaseId: string; notes: string }) => {
      return apiRequest("POST", `/api/admin/purchases/${purchaseId}/reject`, {
        adminEmail: ADMIN_EMAIL, 
        notes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setProcessingNotes("");
    },
  });

  // Manual credit adjustment mutation
  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ hotelId, amount, description }: { hotelId: string; amount: number; description: string }) => {
      return apiRequest("POST", `/api/admin/hotels/${hotelId}/adjust-credits`, {
        amount,
        description,
        adminEmail: ADMIN_EMAIL,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setCreditAdjustment({ amount: 0, description: "" });
      setSelectedHotelId("");
    },
  });

  // Delete hotel mutation
  const deleteHotelMutation = useMutation({
    mutationFn: async (hotelId: string) => {
      return apiRequest("DELETE", `/api/admin/hotels/${hotelId}`, {
        adminEmail: ADMIN_EMAIL
      });
    },
    onSuccess: (data, hotelId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setHotelDetailModal(false);
      setSelectedHotel(null);
      toast({
        title: "Hotel eliminato",
        description: `L'hotel e tutti i dati correlati sono stati eliminati con successo.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore nell'eliminazione",
        description: error.message || "Errore durante l'eliminazione dell'hotel",
        variant: "destructive",
      });
    },
  });

  // Filter hotels based on search query
  const filteredHotels = (hotels as Hotel[]).filter((hotel: Hotel) =>
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.email.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const getPackageInfo = (packageType: string) => {
    const packages = {
      basic: { name: "Basic (20 crediti)", color: "bg-blue-100 text-blue-800" },
      standard: { name: "Standard (45 crediti)", color: "bg-green-100 text-green-800" },
      premium: { name: "Premium (92 crediti)", color: "bg-purple-100 text-purple-800" },
      enterprise: { name: "Enterprise (150 crediti)", color: "bg-orange-100 text-orange-800" },
    };
    return packages[packageType as keyof typeof packages] || packages.basic;
  };

  // Check if user is admin
  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Accesso Negato</CardTitle>
            <CardDescription className="text-center">
              Area riservata agli amministratori
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Effettua il login come Super Admin per accedere a questa area.
            </p>
            <Link href="/admin-login">
              <Button className="w-full">
                Vai al Login Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Accesso Area Admin</CardTitle>
            <CardDescription className="text-center">
              Inserisci la tua email amministrativa per accedere
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email Amministratore</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@esempio.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Password amministratore"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <Button onClick={handleAuth} className="w-full">
              Accedi
            </Button>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Solo gli amministratori autorizzati possono accedere a questa area</p>
              <p><strong>Email:</strong> itinera1prova@gmail.com</p>
              <p><strong>Password:</strong> admin2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hotelsLoading || purchasesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Caricamento dashboard amministratore...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-title text-3xl text-gray-900">Dashboard Amministratore</h1>
          <p className="text-gray-600">Gestione clienti e sistema crediti</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Super Admin: {user?.email}
          </Badge>
          <Link href="/admin-profile">
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Profilo
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti Totali</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(hotels as Hotel[]).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonifici Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{(pendingPurchases as CreditPurchase[]).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crediti Totali Venduti</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(hotels as Hotel[]).reduce((sum: number, hotel: Hotel) => sum + (hotel.totalCredits || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi Stimati</CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{(pendingPurchases as CreditPurchase[]).reduce((sum: number, p: CreditPurchase) => sum + p.packagePrice, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Da bonifici pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Purchases Section */}
      {(pendingPurchases as CreditPurchase[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Bonifici in Attesa di Approvazione
            </CardTitle>
            <CardDescription>
              Questi clienti hanno confermato il bonifico e sono in attesa della tua approvazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(pendingPurchases as CreditPurchase[]).map((purchase: CreditPurchase) => {
                const packageInfo = getPackageInfo(purchase.packageType);
                return (
                  <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{purchase.hotel.name}</h3>
                        <Badge className={packageInfo.color}>{packageInfo.name}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 {purchase.hotel.city}, {purchase.hotel.region}</p>
                        <p>💰 €{purchase.packagePrice} per {purchase.creditsAmount} crediti</p>
                        <p>📅 Richiesto il {new Date(purchase.createdAt).toLocaleDateString('it-IT')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approva
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approva Bonifico</DialogTitle>
                            <DialogDescription>
                              Confermi di aver ricevuto il bonifico di €{purchase.packagePrice} da {purchase.hotel.name}?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="approve-notes">Note approvazione (opzionale)</Label>
                              <Textarea
                                id="approve-notes"
                                placeholder="Eventuali note sull'approvazione..."
                                value={processingNotes}
                                onChange={(e) => setProcessingNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                approveMutation.mutate({ 
                                  purchaseId: purchase.id, 
                                  notes: processingNotes 
                                });
                              }}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {approveMutation.isPending ? "Elaborazione..." : "Conferma Approvazione"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                            <X className="h-4 w-4 mr-1" />
                            Rifiuta
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rifiuta Bonifico</DialogTitle>
                            <DialogDescription>
                              Perché vuoi rifiutare il bonifico di €{purchase.packagePrice} da {purchase.hotel.name}?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reject-notes">Motivo del rifiuto *</Label>
                              <Textarea
                                id="reject-notes"
                                placeholder="Spiega il motivo del rifiuto..."
                                value={processingNotes}
                                onChange={(e) => setProcessingNotes(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (processingNotes.trim()) {
                                  rejectMutation.mutate({ 
                                    purchaseId: purchase.id, 
                                    notes: processingNotes 
                                  });
                                }
                              }}
                              disabled={rejectMutation.isPending || !processingNotes.trim()}
                              variant="destructive"
                            >
                              {rejectMutation.isPending ? "Elaborazione..." : "Conferma Rifiuto"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotels Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Panoramica Clienti ({filteredHotels.length})</CardTitle>
              <CardDescription>Tutti gli hotel registrati e i loro crediti</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cerca hotel, città, regione, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHotels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "Nessun hotel trovato per la ricerca." : "Nessun hotel registrato."}
              </div>
            ) : (
              filteredHotels.map((hotel: Hotel) => (
              <div key={hotel.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                    <Badge variant={hotel.credits > 0 ? "default" : "secondary"}>
                      {hotel.credits} crediti
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📍 {hotel.city}, {hotel.region}</p>
                    <p>📞 {hotel.phone}</p>
                    <p>📧 {hotel.email}</p>
                    <p>💳 Crediti totali acquistati: {hotel.totalCredits || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedHotel(hotel);
                      setHotelDetailModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Dettagli
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Gestisci Crediti
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Gestione Crediti - {hotel.name}</DialogTitle>
                        <DialogDescription>
                          Crediti attuali: {hotel.credits}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="credit-amount">Quantità crediti (usa valori negativi per sottrarre)</Label>
                          <Input
                            id="credit-amount"
                            type="number"
                            placeholder="es. 10 o -5"
                            value={selectedHotelId === hotel.id ? creditAdjustment.amount || "" : ""}
                            onChange={(e) => {
                              setSelectedHotelId(hotel.id);
                              setCreditAdjustment({
                                ...creditAdjustment,
                                amount: parseInt(e.target.value) || 0
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="credit-description">Descrizione modifica</Label>
                          <Textarea
                            id="credit-description"
                            placeholder="Motivo della modifica crediti..."
                            value={selectedHotelId === hotel.id ? creditAdjustment.description : ""}
                            onChange={(e) => {
                              setSelectedHotelId(hotel.id);
                              setCreditAdjustment({
                                ...creditAdjustment,
                                description: e.target.value
                              });
                            }}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            if (selectedHotelId === hotel.id && creditAdjustment.amount !== 0) {
                              adjustCreditsMutation.mutate({
                                hotelId: hotel.id,
                                amount: creditAdjustment.amount,
                                description: creditAdjustment.description
                              });
                            }
                          }}
                          disabled={adjustCreditsMutation.isPending || selectedHotelId !== hotel.id || creditAdjustment.amount === 0}
                        >
                          {adjustCreditsMutation.isPending ? "Elaborazione..." : "Applica Modifica"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hotel Detail Modal */}
      <Dialog open={hotelDetailModal} onOpenChange={setHotelDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Hotel - {selectedHotel?.name}</DialogTitle>
            <DialogDescription>
              Informazioni complete sull'hotel e l'utente registrante
            </DialogDescription>
          </DialogHeader>
          {selectedHotel && (
            <div className="space-y-6">
              {/* Hotel Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Informazioni Hotel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Nome:</span>
                      <span>{selectedHotel.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Località:</span>
                      <span>{selectedHotel.city}, {selectedHotel.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedHotel.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Telefono:</span>
                      <span>{selectedHotel.phone || "Non fornito"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Registrato:</span>
                      <span>{new Date(selectedHotel.createdAt).toLocaleDateString('it-IT')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Sistema Crediti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Crediti attuali:</span>
                      <Badge variant={selectedHotel.credits > 0 ? "default" : "secondary"} className="text-sm">
                        {selectedHotel.credits}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Crediti totali acquistati:</span>
                      <Badge variant="outline" className="text-sm">
                        {selectedHotel.totalCredits || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Crediti utilizzati:</span>
                      <Badge variant="secondary" className="text-sm">
                        {(selectedHotel.totalCredits || 0) - selectedHotel.credits}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-600">
                        Tasso di utilizzo: {(selectedHotel.totalCredits || 0) > 0 
                          ? Math.round((((selectedHotel.totalCredits || 0) - selectedHotel.credits) / (selectedHotel.totalCredits || 1)) * 100)
                          : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedHotel.email}`, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invia Email
                </Button>
                {selectedHotel.phone && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`tel:${selectedHotel.phone}`, '_blank')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Chiama
                  </Button>
                )}
              </div>

              {/* Danger Zone */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-red-600 mb-3">Zona Pericolosa</h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Rimuovi Struttura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro di voler eliminare questo hotel?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>Questa azione eliminerà <strong>definitivamente</strong>:</p>
                        <ul className="list-disc ml-6 space-y-1">
                          <li>L'hotel <strong>{selectedHotel.name}</strong></li>
                          <li>Tutti i profili ospiti associati</li>
                          <li>Tutti gli itinerari generati</li>
                          <li>Tutte le esperienze locali</li>
                          <li>Tutti i dati di fatturazione e crediti</li>
                        </ul>
                        <p className="text-red-600 font-medium">
                          ⚠️ Questa operazione NON può essere annullata!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => selectedHotel && deleteHotelMutation.mutate(selectedHotel.id)}
                        disabled={deleteHotelMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteHotelMutation.isPending ? "Eliminazione..." : "Elimina Definitivamente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHotelDetailModal(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}