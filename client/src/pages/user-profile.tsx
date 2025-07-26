import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Key, LogOut, Edit, Shield, Save, X, Smartphone, QrCode } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

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
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout: authLogout } = useAuth();

  // Use hotelId from AuthProvider if available, fallback to localStorage
  const hotelId = user?.hotelId || localStorage.getItem('hotelId') || "d2dd46f0-97d3-4121-96e3-01500370c73f";

  // Fetch hotel profile
  const { data: hotel, isLoading } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${hotelId}`],
    enabled: !!hotelId,
  });

  // Fetch MFA status
  const { data: mfaStatus } = useQuery({
    queryKey: [`/api/auth/mfa-status`],
    enabled: !!hotelId,
  });

  // Update MFA enabled state when data loads
  useEffect(() => {
    if (mfaStatus?.mfaEnabled !== undefined) {
      setMfaEnabled(mfaStatus.mfaEnabled);
    }
  }, [mfaStatus]);

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("PUT", `/api/hotels/${hotelId}/profile`, {
        email
      });
      return response.json();
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

  // Setup MFA mutation
  const setupMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/setup-mfa`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setMfaSecret(data.secret);
      setQrCodeUrl(data.qrCodeDataUrl);
      setShowMfaSetup(true);
      toast({
        title: "2FA Setup Iniziato",
        description: "Scansiona il QR code con Google Authenticator.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile configurare la 2FA. Riprova.",
        variant: "destructive",
      });
    },
  });

  // Verify MFA mutation
  const verifyMfaMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", `/api/auth/enable-mfa`, { code });
      return response.json();
    },
    onSuccess: () => {
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setMfaToken("");
      toast({
        title: "2FA Attivata",
        description: "Google Authenticator è ora attivo per il tuo account.",
      });
    },
    onError: () => {
      toast({
        title: "Codice Errato",
        description: "Il codice inserito non è valido. Riprova.",
        variant: "destructive",
      });
    },
  });

  // Disable MFA mutation
  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/disable-mfa`, {});
      return response.json();
    },
    onSuccess: () => {
      setMfaEnabled(false);
      toast({
        title: "2FA Disattivata",
        description: "Google Authenticator è stato disattivato.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile disattivare la 2FA. Riprova.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("PUT", `/api/hotels/${hotelId}/profile`, {
        password
      });
      return response.json();
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

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Errore durante il logout",
        description: "Si è verificato un errore, ma sei stato disconnesso localmente.",
        variant: "destructive",
      });
    }
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

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sicurezza Account
          </CardTitle>
          <CardDescription>
            Proteggi il tuo account con l'autenticazione a due fattori
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <Label className="font-medium">Autenticazione a Due Fattori (2FA)</Label>
              </div>
              <div className="flex items-center gap-2">
                {mfaEnabled ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Attiva
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Disattiva
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Aggiungi un livello extra di sicurezza utilizzando Google Authenticator per generare codici di verifica.
            </p>

            {!mfaEnabled ? (
              <Button 
                onClick={() => setupMfaMutation.mutate()}
                disabled={setupMfaMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Shield className="h-4 w-4 mr-2" />
                {setupMfaMutation.isPending ? "Configurando..." : "Configura 2FA"}
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={() => disableMfaMutation.mutate()}
                disabled={disableMfaMutation.isPending}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                {disableMfaMutation.isPending ? "Disattivando..." : "Disattiva 2FA"}
              </Button>
            )}
          </div>

          {/* Security Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Consigli per la Sicurezza</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Utilizza una password sicura e cambiala periodicamente</li>
              <li>• Non condividere le tue credenziali con altre persone</li>
              <li>• Attiva la 2FA per una protezione extra</li>
              <li>• Controlla regolarmente l'attività del tuo account</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup Dialog */}
      <Dialog open={showMfaSetup} onOpenChange={setShowMfaSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configura Google Authenticator</DialogTitle>
            <DialogDescription>
              Segui questi passaggi per attivare l'autenticazione a due fattori
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="text-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code per 2FA" 
                  className="mx-auto border rounded-lg p-2 bg-white"
                />
              </div>
            )}
            
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Passaggio 1:</strong> Installa Google Authenticator sul tuo telefono</p>
              <p><strong>Passaggio 2:</strong> Scansiona il QR code sopra</p>
              <p><strong>Passaggio 3:</strong> Inserisci il codice a 6 cifre generato dall'app</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mfa-token">Codice di Verifica</Label>
              <Input
                id="mfa-token"
                type="text"
                placeholder="123456"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowMfaSetup(false);
                setMfaToken("");
              }}
            >
              Annulla
            </Button>
            <Button 
              onClick={() => verifyMfaMutation.mutate(mfaToken)}
              disabled={verifyMfaMutation.isPending || mfaToken.length !== 6}
            >
              {verifyMfaMutation.isPending ? "Verificando..." : "Verifica e Attiva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}