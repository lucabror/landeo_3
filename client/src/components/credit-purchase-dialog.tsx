import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, CreditCard, Banknote, Star, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CreditPackage {
  type: string;
  name: string;
  price: number;
  credits: number;
  icon: React.ComponentType<any>;
  color: string;
  popular?: boolean;
  description: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    type: "basic",
    name: "Pacchetto Base",
    price: 25,
    credits: 20,
    icon: CreditCard,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Perfetto per iniziare"
  },
  {
    type: "standard", 
    name: "Pacchetto Standard",
    price: 50,
    credits: 45,
    icon: Star,
    color: "bg-green-100 text-green-800 border-green-200",
    popular: true,
    description: "Il più conveniente - 5 crediti bonus!"
  },
  {
    type: "premium",
    name: "Pacchetto Premium", 
    price: 85,
    credits: 92,
    icon: Crown,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Massimo risparmio - 17 crediti bonus!"
  },
  {
    type: "enterprise",
    name: "Pacchetto Enterprise",
    price: 140,
    credits: 150,
    icon: Banknote,
    color: "bg-amber-100 text-amber-800 border-amber-200", 
    description: "Per grandi volumi - 35 crediti bonus!"
  }
];

interface CreditPurchaseDialogProps {
  hotelId: string;
  currentCredits: number;
  children: React.ReactNode;
}

export default function CreditPurchaseDialog({ hotelId, currentCredits, children }: CreditPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: async (packageData: CreditPackage) => {
      return apiRequest("POST", `/api/hotels/${hotelId}/purchase-credits`, {
        packageType: packageData.type,
        packagePrice: packageData.price,
        creditsAmount: packageData.credits
      });
    },
    onSuccess: (data) => {
      console.log("Purchase success:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}/credits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}/credit-purchases`] });
      setIsOpen(false);
      setSelectedPackage(null);
      // Show success message - in a real app, you might want to show a toast or redirect to a success page
      alert("Ordine crediti confermato! Riceverai le istruzioni per il bonifico via email. I crediti saranno attivati dopo la verifica del pagamento.");
    },
    onError: (error) => {
      console.error("Purchase failed:", error);
    },
  });

  const handlePurchase = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
  };

  const confirmPurchase = () => {
    if (selectedPackage) {
      purchaseMutation.mutate(selectedPackage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Acquista Crediti</DialogTitle>
          <DialogDescription>
            Scegli il pacchetto di crediti più adatto alle tue esigenze. Ogni ospite inserito costa 1 credito.
          </DialogDescription>
        </DialogHeader>

        {!selectedPackage ? (
          <div className="space-y-6">
            {/* Current Credits Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Crediti Attuali</h3>
                  <p className="text-blue-700">Hai <strong>{currentCredits}</strong> crediti disponibili</p>
                </div>
                {currentCredits <= 5 && (
                  <Badge variant="destructive">Crediti in esaurimento!</Badge>
                )}
              </div>
            </div>

            {/* Package Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREDIT_PACKAGES.map((pkg) => {
                const Icon = pkg.icon;
                const baseCredits = pkg.price / 1.25; // 1.25€ per credit base price
                const bonusCredits = pkg.credits - baseCredits;
                
                return (
                  <Card 
                    key={pkg.type} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${pkg.popular ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => handlePurchase(pkg)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        </div>
                        {pkg.popular && (
                          <Badge className="bg-green-500">Più Popolare</Badge>
                        )}
                      </div>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">€{pkg.price}</div>
                        <div className="text-lg font-semibold text-green-600">{pkg.credits} crediti</div>
                        {bonusCredits > 0 && (
                          <div className="text-sm text-green-600">
                            +{bonusCredits} crediti bonus!
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Costo per credito:</span>
                          <span>€{(pkg.price / pkg.credits).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ospiti inseribili:</span>
                          <span>{pkg.credits} ospiti</span>
                        </div>
                        {bonusCredits > 0 && (
                          <div className="flex justify-between text-green-600 font-semibold">
                            <span>Risparmio:</span>
                            <span>€{(bonusCredits * 1.25).toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Modalità di Pagamento</h3>
              <p className="text-sm text-gray-600 mb-3">
                Il pagamento avviene tramite <strong>bonifico bancario</strong>. Dopo aver confermato l'ordine riceverai i dati per il bonifico.
              </p>
              <div className="text-xs text-gray-500">
                I crediti verranno attivati dopo la verifica del pagamento da parte dell'amministratore (solitamente entro 24 ore lavorative).
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Confirmation */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conferma Ordine</h3>
              <p className="text-gray-600">Stai per ordinare il seguente pacchetto di crediti:</p>
            </div>

            {/* Order Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <selectedPackage.icon className="h-6 w-6" />
                    <div>
                      <h4 className="font-semibold">{selectedPackage.name}</h4>
                      <p className="text-sm text-gray-600">{selectedPackage.description}</p>
                    </div>
                  </div>
                  <Badge className={selectedPackage.color}>{selectedPackage.credits} crediti</Badge>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prezzo:</span>
                    <span className="font-semibold">€{selectedPackage.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crediti:</span>
                    <span className="font-semibold">{selectedPackage.credits}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Nuovi crediti totali:</span>
                    <span className="font-semibold">{currentCredits + selectedPackage.credits}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Istruzioni per il Bonifico</h4>
              <p className="text-sm text-blue-700 mb-3">
                Dopo la conferma riceverai via email i dettagli per effettuare il bonifico bancario.
                I crediti verranno attivati automaticamente dopo la verifica del pagamento.
              </p>
              <div className="text-xs text-blue-600">
                ⏰ Tempo di attivazione: solitamente entro 24 ore lavorative
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPackage(null)}
                className="flex-1"
              >
                Indietro
              </Button>
              <Button 
                onClick={confirmPurchase}
                disabled={purchaseMutation.isPending}
                className="flex-1"
              >
                {purchaseMutation.isPending ? "Confermando..." : "Conferma Ordine"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}