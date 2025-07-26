import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, Euro, Users, Building, CreditCard, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Hotel {
  id: string;
  name: string;
  city: string;
  region: string;
  email: string;
  credits: number;
  totalCredits: number;
  creditsUsed: number;
  pendingPurchases: number;
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

export default function AdminDashboard() {
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [creditAdjustment, setCreditAdjustment] = useState({ amount: 0, description: "" });
  const [processingNotes, setProcessingNotes] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState("");

  const queryClient = useQueryClient();

  // Check if already authenticated in sessionStorage
  React.useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin-auth');
    if (savedAuth === ADMIN_EMAIL) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = () => {
    if (authEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-auth', ADMIN_EMAIL);
    } else {
      alert('Email non autorizzata per l\'accesso amministrativo');
    }
  };

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
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <Button onClick={handleAuth} className="w-full">
              Accedi
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Solo gli amministratori autorizzati possono accedere a questa area
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      return apiRequest(`/api/admin/purchases/${purchaseId}/approve`, {
        method: "POST",
        body: { adminEmail: ADMIN_EMAIL, notes },
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
      return apiRequest(`/api/admin/purchases/${purchaseId}/reject`, {
        method: "POST",
        body: { adminEmail: ADMIN_EMAIL, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setProcessingNotes("");
    },
  });

  // Adjust credits mutation
  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ hotelId, amount, description }: { hotelId: string; amount: number; description: string }) => {
      return apiRequest(`/api/admin/hotels/${hotelId}/adjust-credits`, {
        method: "POST",
        body: { amount, description, adminEmail: ADMIN_EMAIL },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setCreditAdjustment({ amount: 0, description: "" });
      setSelectedHotelId("");
    },
  });

  const getPackageInfo = (packageType: string) => {
    const packages = {
      basic: { name: "Pacchetto Base", color: "bg-blue-100 text-blue-800" },
      standard: { name: "Pacchetto Standard", color: "bg-green-100 text-green-800" },
      premium: { name: "Pacchetto Premium", color: "bg-purple-100 text-purple-800" },
      enterprise: { name: "Pacchetto Enterprise", color: "bg-gold-100 text-gold-800" }
    };
    return packages[packageType as keyof typeof packages] || { name: packageType, color: "bg-gray-100 text-gray-800" };
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Amministratore</h1>
          <p className="text-gray-600">Gestione clienti e sistema crediti</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Super Admin: {ADMIN_EMAIL}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              sessionStorage.removeItem('admin-auth');
              setIsAuthenticated(false);
              setAuthEmail("");
            }}
          >
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
            <div className="text-2xl font-bold">{hotels.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonifici Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPurchases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crediti Totali Venduti</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hotels.reduce((sum: number, hotel: Hotel) => sum + (hotel.totalCredits || 0), 0)}
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
              €{pendingPurchases.reduce((sum: number, p: CreditPurchase) => sum + p.packagePrice, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Da bonifici pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Purchases Section */}
      {pendingPurchases.length > 0 && (
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
              {pendingPurchases.map((purchase: CreditPurchase) => {
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
                              <Label htmlFor="approve-notes">Note (opzionale)</Label>
                              <Textarea
                                id="approve-notes"
                                value={processingNotes}
                                onChange={(e) => setProcessingNotes(e.target.value)}
                                placeholder="Aggiungi note per il bonifico..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => approveMutation.mutate({ purchaseId: purchase.id, notes: processingNotes })}
                                disabled={approveMutation.isPending}
                                className="flex-1"
                              >
                                {approveMutation.isPending ? "Approvando..." : "Conferma Approvazione"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Rifiuta
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rifiuta Bonifico</DialogTitle>
                            <DialogDescription>
                              Perché stai rifiutando il bonifico di {purchase.hotel.name}?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reject-notes">Motivo del rifiuto *</Label>
                              <Textarea
                                id="reject-notes"
                                value={processingNotes}
                                onChange={(e) => setProcessingNotes(e.target.value)}
                                placeholder="Specifica il motivo del rifiuto..."
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => rejectMutation.mutate({ purchaseId: purchase.id, notes: processingNotes })}
                                disabled={rejectMutation.isPending || !processingNotes.trim()}
                                variant="destructive"
                                className="flex-1"
                              >
                                {rejectMutation.isPending ? "Rifiutando..." : "Conferma Rifiuto"}
                              </Button>
                            </div>
                          </div>
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

      {/* Hotels List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clienti Registrati
          </CardTitle>
          <CardDescription>
            Elenco di tutti i manager registrati con il loro stato crediti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hotels.map((hotel: Hotel) => (
              <div key={hotel.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                    {hotel.pendingPurchases > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        <Euro className="h-3 w-3 mr-1" />
                        {hotel.pendingPurchases} pending
                      </Badge>
                    )}
                    {(hotel.credits || 0) <= 5 && (
                      <Badge variant="destructive" className="text-xs">
                        Crediti bassi
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📍 {hotel.city}, {hotel.region}</p>
                    <p>📧 {hotel.email}</p>
                    <div className="flex gap-4">
                      <span>💳 Crediti: <strong>{hotel.credits || 0}</strong></span>
                      <span>📊 Totali: {hotel.totalCredits || 0}</span>
                      <span>📈 Usati: {hotel.creditsUsed || 0}</span>
                    </div>
                    <p>📅 Registrato il {new Date(hotel.createdAt).toLocaleDateString('it-IT')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Gestisci Crediti
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Gestisci Crediti - {hotel.name}</DialogTitle>
                        <DialogDescription>
                          Aggiungi o rimuovi crediti manualmente per questo hotel
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="credit-amount">Quantità (+ per aggiungere, - per rimuovere)</Label>
                          <Input
                            id="credit-amount"
                            type="number"
                            value={creditAdjustment.amount}
                            onChange={(e) => setCreditAdjustment({ ...creditAdjustment, amount: Number(e.target.value) })}
                            placeholder="es. +10 o -5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="credit-description">Descrizione *</Label>
                          <Textarea
                            id="credit-description"
                            value={creditAdjustment.description}
                            onChange={(e) => setCreditAdjustment({ ...creditAdjustment, description: e.target.value })}
                            placeholder="Motivo della modifica..."
                            required
                          />
                        </div>
                        <Button
                          onClick={() => adjustCreditsMutation.mutate({ 
                            hotelId: hotel.id, 
                            amount: creditAdjustment.amount, 
                            description: creditAdjustment.description 
                          })}
                          disabled={adjustCreditsMutation.isPending || !creditAdjustment.description.trim() || creditAdjustment.amount === 0}
                          className="w-full"
                        >
                          {adjustCreditsMutation.isPending ? "Aggiornando..." : "Conferma Modifica"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}