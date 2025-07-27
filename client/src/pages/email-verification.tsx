import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { CheckCircle, XCircle, Loader2, Hotel } from "lucide-react";

interface EmailVerificationProps {
  token: string;
}

export default function EmailVerification({ token }: EmailVerificationProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await apiRequest(`/api/auth/verify-email`, {
        method: "POST",
        body: JSON.stringify({ token: verificationToken }),
      });
      return response;
    },
    onSuccess: (data) => {
      setVerificationStatus('success');
      toast({
        title: "Email verificata con successo",
        description: "Ora puoi completare la registrazione del tuo hotel.",
      });
      
      // Reindirizza alla pagina di setup hotel dopo 2 secondi
      setTimeout(() => {
        setLocation('/hotel-setup');
      }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-warmgray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
            {verificationStatus === 'loading' && <Loader2 className="w-8 h-8 text-white animate-spin" />}
            {verificationStatus === 'success' && <CheckCircle className="w-8 h-8 text-white" />}
            {verificationStatus === 'error' && <XCircle className="w-8 h-8 text-white" />}
          </div>
          
          <CardTitle className="text-2xl">
            {verificationStatus === 'loading' && "Verificando Email..."}
            {verificationStatus === 'success' && "Email Verificata!"}
            {verificationStatus === 'error' && "Verifica Fallita"}
          </CardTitle>
          
          <CardDescription>
            {verificationStatus === 'loading' && "Stiamo verificando il tuo account..."}
            {verificationStatus === 'success' && "Il tuo account è stato verificato con successo"}
            {verificationStatus === 'error' && "Non siamo riusciti a verificare il tuo account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {verificationStatus === 'loading' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Verifica in corso, attendere prego...
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  La tua email è stata verificata con successo! 
                  Sarai reindirizzato alla pagina di configurazione del hotel.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Reindirizzamento automatico in corso...
                </p>
                <Link href="/hotel-setup">
                  <Button className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900">
                    <Hotel className="mr-2 h-4 w-4" />
                    Configura il Tuo Hotel
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Il link di verifica non è valido o è scaduto. 
                  Richiedi un nuovo link di verifica o contatta il supporto.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Link href="/hotel-register">
                  <Button variant="outline" className="w-full">
                    Riprova Registrazione
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Torna alla Home
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