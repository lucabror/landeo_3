import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface ResetMfaData {
  email: string;
  password: string;
  userType: 'hotel' | 'admin';
}

export default function MfaReset() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<'hotel' | 'admin'>('hotel');
  const [resetCompleted, setResetCompleted] = useState(false);
  const { toast } = useToast();

  const resetMfaMutation = useMutation({
    mutationFn: async (data: ResetMfaData) => {
      const response = await apiRequest('POST', '/api/auth/reset-mfa', data);
      return response.json();
    },
    onSuccess: (data) => {
      setResetCompleted(true);
      toast({
        title: "MFA Resettato",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore Reset MFA",
        description: error.message || "Impossibile resettare MFA. Verifica le credenziali.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci email e password per procedere.",
        variant: "destructive",
      });
      return;
    }

    resetMfaMutation.mutate({ email, password, userType });
  };

  if (resetCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>MFA Resettato con Successo</CardTitle>
            <CardDescription>
              Il tuo Google Authenticator è stato resettato e disattivato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Prossimi Passi:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>1. Effettua il login normale (senza 2FA)</li>
                <li>2. Vai nelle impostazioni del tuo profilo</li>
                <li>3. Riconfigura Google Authenticator</li>
                <li>4. Scansiona il nuovo QR code</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Link href="/login" className="flex-1">
                <Button className="w-full">
                  Torna al Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle>Reset Google Authenticator</CardTitle>
          <CardDescription>
            Usa questo modulo se hai perso l'accesso al tuo Google Authenticator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Procedura di Sicurezza</p>
              <p>Inserisci le tue credenziali per disattivare temporaneamente il 2FA. Dovrai riconfigurarlo dopo il login.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="userType">Tipo di Account</Label>
              <Select value={userType} onValueChange={(value: 'hotel' | 'admin') => setUserType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel Manager</SelectItem>
                  <SelectItem value="admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email di accesso"
                required
              />
            </div>

            <div>
              <Label htmlFor="reset-password">Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password attuale"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={resetMfaMutation.isPending}
            >
              {resetMfaMutation.isPending ? "Resettando..." : "Reset MFA"}
            </Button>

            <div className="text-center">
              <Link href="/login">
                <Button variant="link" className="text-sm">
                  Torna al Login
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}