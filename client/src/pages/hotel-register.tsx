import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Hotel, Mail, Eye, EyeOff, CheckCircle, ArrowLeft, Check, X } from "lucide-react";

// Password requirements
const passwordRequirements = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

const passwordSchema = z.string()
  .min(passwordRequirements.minLength, `Minimo ${passwordRequirements.minLength} caratteri`)
  .refine(val => passwordRequirements.hasUppercase.test(val), "Almeno una lettera maiuscola")
  .refine(val => passwordRequirements.hasLowercase.test(val), "Almeno una lettera minuscola")
  .refine(val => passwordRequirements.hasNumber.test(val), "Almeno un numero")
  .refine(val => passwordRequirements.hasSpecialChar.test(val), "Almeno un carattere speciale (!@#$%^&*)");

const registerSchema = z.object({
  email: z.string().email("Email non valida"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function HotelRegister() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check password requirements
  const checkRequirement = (requirement: RegExp, value: string) => requirement.test(value);
  const checkLength = (value: string) => value.length >= passwordRequirements.minLength;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest(
        "POST",
        "/api/auth/register-hotel",
        {
          email: data.email,
          password: data.password,
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      setUserEmail(form.getValues("email"));
      setRegistrationComplete(true);
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare l'account.",
      });
      
      // Mostra link di debug in modalità sviluppo
      if (data.debugVerificationUrl) {

        toast({
          title: "Debug - Link di verifica",
          description: `Link: ${data.debugVerificationUrl}`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore nella registrazione",
        description: error.message || "Si è verificato un errore durante la registrazione.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-warmgray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Controlla la tua Email</CardTitle>
            <CardDescription>
              Abbiamo inviato un link di conferma a {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Clicca sul link nell'email per confermare il tuo account e completare la registrazione del tuo hotel.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                Non hai ricevuto l'email? Controlla la cartella spam o contatta il supporto.
              </p>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Torna alla Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-warmgray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Registra il Tuo Hotel</CardTitle>
          <CardDescription>
            Crea il tuo account per iniziare a offrire esperienze straordinarie ai tuoi ospiti
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="manager@tuohotel.it"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Crea una password sicura"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setPassword(e.target.value);
                            }}
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
                        
                        {/* Password Requirements */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Requisiti password:</p>
                          <div className="space-y-1">
                            <div className={`flex items-center gap-2 text-xs ${checkLength(password) ? 'text-green-600' : 'text-gray-500'}`}>
                              {checkLength(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Almeno 8 caratteri</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${checkRequirement(passwordRequirements.hasUppercase, password) ? 'text-green-600' : 'text-gray-500'}`}>
                              {checkRequirement(passwordRequirements.hasUppercase, password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Una lettera maiuscola (A-Z)</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${checkRequirement(passwordRequirements.hasLowercase, password) ? 'text-green-600' : 'text-gray-500'}`}>
                              {checkRequirement(passwordRequirements.hasLowercase, password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Una lettera minuscola (a-z)</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${checkRequirement(passwordRequirements.hasNumber, password) ? 'text-green-600' : 'text-gray-500'}`}>
                              {checkRequirement(passwordRequirements.hasNumber, password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Un numero (0-9)</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${checkRequirement(passwordRequirements.hasSpecialChar, password) ? 'text-green-600' : 'text-gray-500'}`}>
                              {checkRequirement(passwordRequirements.hasSpecialChar, password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Un carattere speciale (!@#$%^&*)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferma Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Ripeti la password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registrazione..." : "Registra Account"}
              </Button>

              <div className="text-center border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Hai già un account?
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                    Accedi al Tuo Account
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}