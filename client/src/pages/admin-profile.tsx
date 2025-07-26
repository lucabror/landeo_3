import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Smartphone, CheckCircle, X, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function AdminProfile() {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout: authLogout } = useAuth();

  // Get admin ID from auth
  const adminId = user?.id || "admin";

  // Fetch admin data
  const { data: admin, isLoading } = useQuery({
    queryKey: ["/api/admin/profile", adminId],
    enabled: !!adminId,
  });

  // Check MFA status
  const { data: mfaStatus } = useQuery({
    queryKey: ["/api/auth/mfa-status"],
    enabled: !!adminId,
  });

  useEffect(() => {
    if (mfaStatus && typeof mfaStatus === 'object' && 'mfaEnabled' in mfaStatus) {
      setMfaEnabled(Boolean(mfaStatus.mfaEnabled));
    }
  }, [mfaStatus]);

  useEffect(() => {
    if (admin && typeof admin === 'object' && 'email' in admin) {
      setNewEmail(String(admin.email) || "");
    }
  }, [admin]);

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', `/api/admin/${adminId}/update-email`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile", adminId] });
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
      return apiRequest('POST', `/api/admin/${adminId}/update-password`, { password });
    },
    onSuccess: () => {
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

  // Setup MFA mutation
  const setupMfaMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/setup-mfa', {});
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setQrCodeDataUrl(data.qrCodeDataUrl);
      toast({
        title: "Setup MFA",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore setup MFA",
        description: error.message || "Errore nella configurazione dell'autenticazione",
        variant: "destructive",
      });
    },
  });

  // Enable MFA mutation
  const enableMfaMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('POST', '/api/auth/enable-mfa', { code });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setMfaEnabled(true);
      setShowMfaDialog(false);
      setQrCodeDataUrl("");
      setMfaToken("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/mfa-status"] });
      toast({
        title: "MFA Attivato",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore attivazione MFA",
        description: error.message || "Codice di verifica non valido",
        variant: "destructive",
      });
    },
  });

  // Disable MFA mutation
  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/disable-mfa', {});
    },
    onSuccess: () => {
      setMfaEnabled(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/mfa-status"] });
      toast({
        title: "MFA Disattivato",
        description: "Google Authenticator è stato disattivato",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore disattivazione MFA",
        description: error.message || "Impossibile disattivare MFA",
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

  const handleSetupMfa = () => {
    setupMfaMutation.mutate();
    setShowMfaDialog(true);
  };

  const handleEnableMfa = () => {
    if (mfaToken.length === 6) {
      enableMfaMutation.mutate(mfaToken);
    } else {
      toast({
        title: "Codice non valido",
        description: "Inserisci un codice di 6 cifre",
        variant: "destructive",
      });
    }
  };

  const handleDisableMfa = () => {
    disableMfaMutation.mutate();
  };

  if (!adminId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">Devi essere autenticato per accedere al profilo.</p>
            <Link href="/admin-login">
              <Button>Torna al Login</Button>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profilo Amministratore</h1>
          <p className="text-gray-600">Gestisci le impostazioni del tuo account super admin</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin-dashboard">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Impostazioni Account
            </CardTitle>
            <CardDescription>
              Aggiorna le informazioni del tuo account amministratore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Update */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Inserisci nuova email"
                />
                <Button 
                  onClick={handleEmailUpdate}
                  disabled={updateEmailMutation.isPending}
                >
                  Aggiorna
                </Button>
              </div>
            </div>

            {/* Password Update */}
            <div className="space-y-4">
              <Label>Cambia Password</Label>
              <div className="space-y-2">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nuova password"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Conferma password"
                />
                <Button 
                  onClick={handlePasswordUpdate}
                  disabled={updatePasswordMutation.isPending}
                  className="w-full"
                >
                  Aggiorna Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Sicurezza
            </CardTitle>
            <CardDescription>
              Gestisci l'autenticazione a due fattori per una maggiore sicurezza
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* MFA Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium">Google Authenticator</div>
                  <div className="text-sm text-gray-600">
                    Autenticazione a due fattori
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mfaEnabled ? (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Attivo
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDisableMfa}
                      disabled={disableMfaMutation.isPending}
                    >
                      Disattiva
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      <X className="mr-1 h-3 w-3" />
                      Inattivo
                    </Badge>
                    <Button 
                      size="sm"
                      onClick={handleSetupMfa}
                      disabled={setupMfaMutation.isPending}
                    >
                      Configura
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* MFA Info */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Perché usare l'autenticazione a due fattori?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Protezione aggiuntiva per il tuo account amministratore</li>
                  <li>• Sicurezza contro accessi non autorizzati</li>
                  <li>• Conformità alle migliori pratiche di sicurezza</li>
                </ul>
              </div>
              
              {mfaEnabled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">Hai perso l'accesso a Google Authenticator?</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Se hai cancellato l'app o cambiato telefono, puoi resettare il 2FA usando le tue credenziali.
                  </p>
                  <Link href="/mfa-reset">
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                      Reset MFA di Emergenza
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MFA Setup Dialog */}
      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Configura Google Authenticator
            </DialogTitle>
            <DialogDescription>
              Scansiona il codice QR con la tua app Google Authenticator
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCodeDataUrl && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code per Google Authenticator"
                  className="border rounded-lg"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="mfaToken">Codice di verifica (6 cifre)</Label>
              <Input
                id="mfaToken"
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowMfaDialog(false);
                setQrCodeDataUrl("");
                setMfaToken("");
              }}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleEnableMfa}
              disabled={enableMfaMutation.isPending || mfaToken.length !== 6}
            >
              {enableMfaMutation.isPending ? "Attivazione..." : "Attiva MFA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}