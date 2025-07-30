import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { CheckCircle, XCircle, Loader2, LogIn, Hotel } from "lucide-react";

interface RegistrationConfirmedProps {
  token: string;
}

export default function RegistrationConfirmed({ token }: RegistrationConfirmedProps) {
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await apiRequest(
        "POST",
        "/api/auth/verify-email",
        { token: verificationToken }
      );
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationStatus('success');
      toast({
        title: "Registrazione confermata",
        description: "Il tuo account hotel è stato attivato con successo.",
      });
    },
    onError: (error: any) => {
      setVerificationStatus('error');
      toast({
        title: "Errore nella verifica",
        description: error.message || "Token di verifica non valido o scaduto.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setVerificationStatus('error');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-700 to-amber-800 rounded-full flex items-center justify-center mx-auto mb-6">
            {verificationStatus === 'loading' && <Loader2 className="w-10 h-10 text-white animate-spin" />}
            {verificationStatus === 'success' && <CheckCircle className="w-10 h-10 text-white" />}
            {verificationStatus === 'error' && <XCircle className="w-10 h-10 text-white" />}
          </div>
          
          <CardTitle className="text-3xl font-bold">
            {verificationStatus === 'loading' && "Verificando Registrazione..."}
            {verificationStatus === 'success' && "Registrazione Confermata!"}
            {verificationStatus === 'error' && "Verifica Fallita"}
          </CardTitle>
          
          <CardDescription className="text-lg">
            {verificationStatus === 'loading' && "Stiamo confermando la tua registrazione..."}
            {verificationStatus === 'success' && "Il tuo account hotel è stato attivato con successo"}
            {verificationStatus === 'error' && "Non siamo riusciti a verificare la tua registrazione"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {verificationStatus === 'loading' && (
            <div className="space-y-4">
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Conferma della registrazione in corso, attendere...
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Perfetto!</strong> La tua registrazione è stata confermata con successo. 
                  Ora puoi accedere alla piattaforma Landeo per configurare il tuo hotel e iniziare a creare esperienze uniche per i tuoi ospiti.
                </AlertDescription>
              </Alert>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">✨ Prossimi passi:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Accedi alla tua dashboard hotel</li>
                  <li>• Completa la configurazione del tuo hotel</li>
                  <li>• Aggiungi esperienze locali per i tuoi ospiti</li>
                  <li>• Inizia a creare itinerari personalizzati con l'AI</li>
                </ul>
              </div>
              
              <div className="text-center space-y-3">
                <Link href="/login">
                  <Button size="lg" className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white">
                    <LogIn className="mr-2 h-5 w-5" />
                    Accedi alla Dashboard Hotel
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-600">
                  Usa le credenziali che hai scelto durante la registrazione
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Non siamo riusciti a confermare la tua registrazione. Il link potrebbe essere scaduto o già utilizzato.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-3">
                <Link href="/hotel-register">
                  <Button variant="outline" className="w-full">
                    <Hotel className="mr-2 h-4 w-4" />
                    Riprova Registrazione
                  </Button>
                </Link>
                
                <Link href="/login">
                  <Button variant="link" className="w-full text-amber-700">
                    Hai già un account? Accedi qui
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}