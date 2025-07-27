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
import { Shield, Lock, Eye, EyeOff, Building2, UserCog } from "lucide-react";
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

export default function UniversalLogin() {
  const [step, setStep] = useState<'login' | 'setup-password' | 'mfa-verify' | 'forgot-password'>('login');
  const [tempSessionToken, setTempSessionToken] = useState<string>("");
  const [userType, setUserType] = useState<'hotel' | 'admin' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine user type from email
  const determineUserType = (email: string): 'hotel' | 'admin' => {
    const adminEmails = ['itinera1prova@gmail.com', 'admin@itineraitalia.it'];
    return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'hotel';
  };

  // Forms
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const setupPasswordForm = useForm<SetupPasswordFormData>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const mfaVerifyForm = useForm<MfaVerifyFormData>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: { code: "" },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData & { userType: 'hotel' | 'admin' }) => {
      const response = await apiRequest('POST', `/api/auth/login/${data.userType}`, {
        email: data.email,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.requiresSetup) {
        setStep('setup-password');
        setTempSessionToken(data.tempToken);
        setUserType(variables.userType);
      } else if (data.requiresMfa || data.requiresMfaSetup) {
        setStep('mfa-verify');
        setTempSessionToken(data.sessionToken);
        setUserType(variables.userType);
      } else {
        login(data.user, data.sessionToken);
        const redirectPath = variables.userType === 'admin' ? '/admin-dashboard' : '/dashboard';
        setLocation(redirectPath);
        toast({
          title: "Login effettuato",
          description: `Benvenuto/a, ${data.user.name || data.user.email}!`,
        });
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
      const response = await apiRequest('POST', '/api/auth/setup-password', {
        tempToken: tempSessionToken,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresMfaSetup) {
        setStep('mfa-verify');
        setTempSessionToken(data.sessionToken);
      } else {
        login(data.user, data.sessionToken);
        const redirectPath = userType === 'admin' ? '/admin-dashboard' : '/dashboard';
        setLocation(redirectPath);
        toast({
          title: "Password configurata",
          description: "Account configurato con successo!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore configurazione",
        description: error.message || "Errore durante la configurazione della password",
        variant: "destructive",
      });
    },
  });

  // MFA verify mutation
  const verifyMfaMutation = useMutation({
    mutationFn: async (data: MfaVerifyFormData) => {
      const response = await apiRequest('POST', '/api/auth/verify-mfa', {
        sessionToken: tempSessionToken,
        code: data.code,
      });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user, data.sessionToken);
      const redirectPath = userType === 'admin' ? '/admin-dashboard' : '/dashboard';
      setLocation(redirectPath);
      toast({
        title: "Accesso completato",
        description: `Benvenuto/a, ${data.user.name || data.user.email}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Codice non valido",
        description: error.message || "Verifica il codice e riprova",
        variant: "destructive",
      });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const detectedUserType = determineUserType(data.email);
      const response = await apiRequest('POST', '/api/auth/forgot-password', {
        email: data.email,
        userType: detectedUserType,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "Controlla la tua email per le istruzioni di reset della password.",
      });
      setStep('login');
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'invio dell'email",
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const onLoginSubmit = (data: LoginFormData) => {
    const detectedUserType = determineUserType(data.email);
    setUserType(detectedUserType);
    loginMutation.mutate({ ...data, userType: detectedUserType });
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

  const getUserTypeIcon = () => {
    if (!userType) return <Lock className="w-6 h-6 text-amber-600" />;
    return userType === 'admin' ? 
      <UserCog className="w-6 h-6 text-purple-600" /> : 
      <Building2 className="w-6 h-6 text-blue-600" />;
  };

  const getUserTypeLabel = () => {
    if (!userType) return "Accesso Sistema";
    return userType === 'admin' ? "Super Amministratore" : "Hotel Manager";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            {getUserTypeIcon()}
          </div>
          <CardTitle>
            {step === 'login' && "Accesso ItineraItalia"}
            {step === 'setup-password' && "Configura Password"}
            {step === 'mfa-verify' && "Verifica 2FA"}
            {step === 'forgot-password' && "Reset Password"}
          </CardTitle>
          <CardDescription>
            {step === 'login' && "Inserisci le tue credenziali per accedere"}
            {step === 'setup-password' && "Imposta una password sicura per il tuo account"}
            {step === 'mfa-verify' && `Inserisci il codice da Google Authenticator - ${getUserTypeLabel()}`}
            {step === 'forgot-password' && "Riceverai un'email con le istruzioni"}
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
                          placeholder="tua@email.com"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-detect user type for visual feedback
                            const detected = determineUserType(e.target.value);
                            if (e.target.value.includes('@')) {
                              setUserType(detected);
                            }
                          }}
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
                            placeholder="La tua password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  {loginMutation.isPending ? "Accesso..." : "Accedi"}
                </Button>

                <div className="text-center space-y-2">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep('forgot-password')}
                    className="text-sm"
                  >
                    Password dimenticata?
                  </Button>
                  
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Non hai ancora registrato il tuo hotel?
                    </p>
                    <Link href="/hotel-setup">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Registra il Tuo Hotel
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          )}

          {step === 'setup-password' && (
            <Form {...setupPasswordForm}>
              <form onSubmit={setupPasswordForm.handleSubmit(onSetupPasswordSubmit)} className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Configura una password sicura per il tuo account hotel.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={setupPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuova Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimo 8 caratteri"
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
                          placeholder="Ripeti la password"
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

          {step === 'forgot-password' && (
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
                          placeholder="La tua email di accesso"
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
                  {forgotPasswordMutation.isPending ? "Invio..." : "Invia Email Reset"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep('login')}
                    className="text-sm"
                  >
                    Torna al Login
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}