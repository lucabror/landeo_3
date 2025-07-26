import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve essere di almeno 8 caratteri"),
});

const setupPasswordSchema = z.object({
  password: z.string().min(8, "La password deve essere di almeno 8 caratteri"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

const mfaVerifySchema = z.object({
  code: z.string().length(6, "Il codice deve essere di 6 cifre"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SetupPasswordFormData = z.infer<typeof setupPasswordSchema>;
type MfaVerifyFormData = z.infer<typeof mfaVerifySchema>;

interface LoginProps {
  userType: 'hotel' | 'admin';
}

export default function Login({ userType }: LoginProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'login' | 'setup-password' | 'mfa-setup' | 'mfa-verify'>('login');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [hotelId, setHotelId] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const setupPasswordForm = useForm<SetupPasswordFormData>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mfaVerifyForm = useForm<MfaVerifyFormData>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: {
      code: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest(`/api/auth/login/${userType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userType }),
      });
    },
    onSuccess: (response) => {
      if (response.requiresSetup) {
        setRequiresSetup(true);
        setHotelId(response.hotelId);
        setStep('setup-password');
        return;
      }
      
      if (response.requiresMfaSetup) {
        setSessionToken(response.sessionToken);
        setStep('mfa-setup');
        return;
      }
      
      if (response.requiresMfa) {
        setSessionToken(response.sessionToken);
        setStep('mfa-verify');
        return;
      }
      
      // Login successful
      localStorage.setItem('sessionToken', response.sessionToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast({
        title: "Accesso completato",
        description: "Benvenuto nella piattaforma Itinera",
      });
      
      if (userType === 'admin') {
        setLocation('/admin-dashboard');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      });
    },
  });

  // Setup password mutation
  const setupPasswordMutation = useMutation({
    mutationFn: async (data: SetupPasswordFormData) => {
      return apiRequest('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          password: data.password,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Password configurata",
        description: "Ora puoi accedere con la tua password",
      });
      setStep('login');
      setRequiresSetup(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore configurazione",
        description: error.message || "Errore nella configurazione della password",
        variant: "destructive",
      });
    },
  });

  // Setup MFA mutation
  const setupMfaMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/setup-mfa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
    },
    onSuccess: (response) => {
      setQrCodeDataUrl(response.qrCodeDataUrl);
      toast({
        title: "Setup MFA",
        description: response.message,
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
      return apiRequest('/api/auth/enable-mfa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ code }),
      });
    },
    onSuccess: () => {
      toast({
        title: "MFA Configurato",
        description: "Google Authenticator configurato con successo",
      });
      setStep('mfa-verify');
    },
    onError: (error: any) => {
      toast({
        title: "Errore attivazione MFA",
        description: error.message || "Codice di verifica non valido",
        variant: "destructive",
      });
    },
  });

  // Verify MFA mutation
  const verifyMfaMutation = useMutation({
    mutationFn: async (data: MfaVerifyFormData) => {
      return apiRequest('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          code: data.code,
        }),
      });
    },
    onSuccess: (response) => {
      localStorage.setItem('sessionToken', response.sessionToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast({
        title: "Accesso completato",
        description: "Autenticazione a due fattori verificata",
      });
      
      if (userType === 'admin') {
        setLocation('/admin-dashboard');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore verifica",
        description: error.message || "Codice non valido",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onSetupPasswordSubmit = (data: SetupPasswordFormData) => {
    setupPasswordMutation.mutate(data);
  };

  const onMfaVerifySubmit = (data: MfaVerifyFormData) => {
    verifyMfaMutation.mutate(data);
  };

  const handleSetupMfa = () => {
    setupMfaMutation.mutate();
  };

  const handleEnableMfa = () => {
    const code = mfaVerifyForm.getValues('code');
    if (code.length === 6) {
      enableMfaMutation.mutate(code);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {userType === 'admin' ? 'Admin Login' : 'Hotel Manager Login'}
          </CardTitle>
          <CardDescription>
            Accesso sicuro alla piattaforma Itinera
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 'login' && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="inserisci la tua email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="inserisci la tua password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
                </Button>
              </form>
            </Form>
          )}

          {step === 'setup-password' && (
            <div className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Configura una password sicura per il tuo account hotel.
                </AlertDescription>
              </Alert>
              
              <Form {...setupPasswordForm}>
                <form onSubmit={setupPasswordForm.handleSubmit(onSetupPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={setupPasswordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nuova Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="minimo 8 caratteri"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={setupPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conferma Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="ripeti la password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={setupPasswordMutation.isPending}
                  >
                    {setupPasswordMutation.isPending ? "Configurazione..." : "Configura Password"}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {step === 'mfa-setup' && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Per la massima sicurezza, devi configurare Google Authenticator.
                </AlertDescription>
              </Alert>
              
              {!qrCodeDataUrl ? (
                <Button
                  onClick={handleSetupMfa}
                  className="w-full"
                  disabled={setupMfaMutation.isPending}
                >
                  {setupMfaMutation.isPending ? "Generazione..." : "Configura Google Authenticator"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Scansiona questo codice QR con Google Authenticator:
                    </p>
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code per Google Authenticator" 
                      className="mx-auto border rounded-lg p-2"
                    />
                  </div>
                  
                  <Form {...mfaVerifyForm}>
                    <FormField
                      control={mfaVerifyForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Codice di Verifica</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123456"
                              maxLength={6}
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                  
                  <Button
                    onClick={handleEnableMfa}
                    className="w-full"
                    disabled={enableMfaMutation.isPending}
                  >
                    {enableMfaMutation.isPending ? "Verifica..." : "Attiva Google Authenticator"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'mfa-verify' && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Inserisci il codice di 6 cifre da Google Authenticator.
                </AlertDescription>
              </Alert>
              
              <Form {...mfaVerifyForm}>
                <form onSubmit={mfaVerifyForm.handleSubmit(onMfaVerifySubmit)} className="space-y-4">
                  <FormField
                    control={mfaVerifyForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Google Authenticator</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123456"
                            maxLength={6}
                            className="text-center text-lg tracking-widest"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verifyMfaMutation.isPending}
                  >
                    {verifyMfaMutation.isPending ? "Verifica..." : "Verifica e Accedi"}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}