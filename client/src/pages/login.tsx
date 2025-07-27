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
import { useLocation, Link } from "wouter";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Email non valida"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SetupPasswordFormData = z.infer<typeof setupPasswordSchema>;
type MfaVerifyFormData = z.infer<typeof mfaVerifySchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface LoginProps {
  userType: 'hotel' | 'admin';
}

export default function Login({ userType }: LoginProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login: authLogin } = useAuth();
  
  const [step, setStep] = useState<'login' | 'setup-password' | 'mfa-setup' | 'mfa-verify' | 'forgot-password'>('login');
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

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest('POST', `/api/auth/login/${userType}`, { ...data, userType });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      if (data.requiresSetup) {
        setRequiresSetup(true);
        setHotelId(data.hotelId);
        setStep('setup-password');
        return;
      }
      
      if (data.requiresMfaSetup) {
        setSessionToken(data.sessionToken);
        setStep('mfa-setup');
        return;
      }
      
      if (data.requiresMfa) {
        setSessionToken(data.sessionToken);
        setStep('mfa-verify');
        return;
      }
      
      // Selective cleanup - only auth data
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      
      // Login successful - use AuthProvider login method
      authLogin({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        type: data.user.type,
        hotelId: data.user.id
      }, data.sessionToken);
      
      toast({
        title: "Accesso completato",
        description: "Benvenuto nella piattaforma Itinera",
      });
      
      // Force page refresh to ensure clean auth state
      if (data.user.type === 'admin') {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/dashboard';
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
      return apiRequest('POST', '/api/auth/setup-password', {
        hotelId,
        password: data.password,
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
      return apiRequest('POST', '/api/auth/setup-mfa', {}, {
        'Authorization': `Bearer ${sessionToken}`,
      });
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
      return apiRequest('POST', '/api/auth/enable-mfa', { code }, {
        'Authorization': `Bearer ${sessionToken}`,
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
      return apiRequest('POST', '/api/auth/verify-mfa', {
        sessionToken,
        code: data.code,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Selective cleanup - only auth data
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      
      // Use AuthProvider login method with correct parameter order
      authLogin({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        type: data.user.type,
        hotelId: data.user.hotelId || data.user.id
      }, data.sessionToken);
      
      toast({
        title: "Accesso completato",
        description: "Autenticazione a due fattori verificata",
      });
      
      // Force page refresh to ensure clean auth state
      if (data.user.type === 'admin') {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/dashboard';
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

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      return apiRequest('POST', '/api/auth/forgot-password', { ...data, userType });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Email inviata",
        description: data.message,
      });
      setStep('login');
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'invio dell'email",
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

  const onForgotPasswordSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
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
            <>
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
            
            <div className="mt-4 text-center space-y-2">
              <Button 
                variant="link" 
                className="text-sm text-primary hover:text-primary/80"
                onClick={() => setStep('forgot-password')}
              >
                Password dimenticata?
              </Button>
              
              <div>
                <Button 
                  variant="link" 
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    // Clear all auth data and refresh
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                >
                  Problemi di accesso? Pulisci cache
                </Button>
              </div>
            </div>
            </>
          )}

          {/* Forgot Password Form */}
          {step === 'forgot-password' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Password Dimenticata</h3>
              </div>
              
              <Alert>
                <AlertDescription>
                  Inserisci la tua email per ricevere le istruzioni di reset della password.
                </AlertDescription>
              </Alert>
              
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="la-tua-email@hotel.com"
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
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? "Invio in corso..." : "Invia Email di Reset"}
                  </Button>
                </form>
              </Form>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => setStep('login')}
                >
                  ← Torna al login
                </Button>
              </div>
            </div>
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