import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Key, LogOut, Edit, Shield, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

interface Hotel {
  id: string;
  name: string;
  email: string;
  password: string;
  city: string;
  region: string;
  phone: string;
  credits: number;
  totalCredits?: number;
  createdAt: string;
}

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get hotel ID from localStorage (assuming it's stored during login)
  // For demo purposes, using the mock hotel ID
  const hotelId = localStorage.getItem('hotelId') || "d2dd46f0-97d3-4121-96e3-01500370c73f";

  // Fetch hotel profile
  const { data: hotel, isLoading } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${hotelId}`],
    enabled: !!hotelId,
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("PUT", `/api/hotels/${hotelId}/profile`, {
        email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}`] });
      setEditingEmail(false);
      setNewEmail("");
      toast({
        title: "Email aggiornata",
        description: "La tua email è stata modificata con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'email. Riprova.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest("PUT", `/api/hotels/${hotelId}/profile`, {
        password
      });
    },
    onSuccess: () => {
      setEditingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password aggiornata",
        description: "La tua password è stata modificata con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la password. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleEmailUpdate = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido.",
        variant: "destructive",
      });
      return;
    }
    updateEmailMutation.mutate(newEmail);
  };

  const handlePasswordUpdate = () => {
    if (newPassword.length < 6) {
      toast({
        title: "Password troppo corta",
        description: "La password deve avere almeno 6 caratteri.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "Le password inserite non corrispondono.",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate(newPassword);
  };

  const handleLogout = () => {
    localStorage.removeItem('hotelId');
    setLocation('/');
    toast({
      title: "Logout effettuato",
      description: "Sei stato disconnesso con successo.",
    });
  };

  if (!hotelId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">Devi essere autenticato per accedere al profilo.</p>
            <Link href="/">
              <Button>Torna alla Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Caricamento profilo...</div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">Hotel non trovato.</p>
            <Link href="/">
              <Button>Torna alla Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profilo Utente</h1>
          <p className="text-gray-600">Gestisci le tue informazioni di accesso</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline">
              Torna alla Dashboard
            </Button>
          </Link>
          <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conferma Logout</DialogTitle>
                <DialogDescription>
                  Sei sicuro di voler uscire? Dovrai reinserire le credenziali per accedere nuovamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
                  Annulla
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  Conferma Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hotel Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informazioni Hotel
          </CardTitle>
          <CardDescription>
            Dettagli del tuo hotel registrato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Nome Hotel</Label>
              <p className="text-lg font-semibold text-gray-900">{hotel.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Città</Label>
              <p className="text-gray-900">{hotel.city}, {hotel.region}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Telefono</Label>
              <p className="text-gray-900">{hotel.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Crediti Disponibili</Label>
              <div className="flex items-center gap-2">
                <Badge variant={hotel.credits > 0 ? "default" : "secondary"}>
                  {hotel.credits} crediti
                </Badge>
                <span className="text-sm text-gray-500">
                  (Totali acquistati: {hotel.totalCredits || 0})
                </span>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Data Registrazione</Label>
            <p className="text-gray-900">{new Date(hotel.createdAt).toLocaleDateString('it-IT')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Login Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Credenziali di Accesso
          </CardTitle>
          <CardDescription>
            Gestisci email e password per l'accesso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Label className="font-medium">Email di Accesso</Label>
              </div>
              {!editingEmail && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingEmail(true);
                    setNewEmail(hotel.email);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
              )}
            </div>
            
            {editingEmail ? (
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Nuova email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleEmailUpdate}
                    disabled={updateEmailMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateEmailMutation.isPending ? "Salvando..." : "Salva"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingEmail(false);
                      setNewEmail("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">
                {hotel.email}
              </p>
            )}
          </div>

          {/* Password Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-gray-500" />
                <Label className="font-medium">Password</Label>
              </div>
              {!editingPassword && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingPassword(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
              )}
            </div>
            
            {editingPassword ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-password">Nuova Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimo 6 caratteri"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Conferma Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Ripeti la nuova password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handlePasswordUpdate}
                    disabled={updatePasswordMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updatePasswordMutation.isPending ? "Salvando..." : "Salva"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-mono bg-gray-50 p-2 rounded">
                ••••••••••••
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Sicurezza Account</h4>
              <p className="text-sm text-gray-600">
                Ti consigliamo di utilizzare una password sicura e di cambiarla periodicamente. 
                Non condividere le tue credenziali con altre persone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}