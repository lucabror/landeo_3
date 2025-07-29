import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/sidebar";
import { 
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { ProtectedRoute, useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function PurchaseHistoryContent() {
  const { user } = useAuth();
  const hotelId = user?.hotelId || user?.id;

  // Fetch credit purchases
  const { data: creditPurchases, isLoading } = useQuery({
    queryKey: ["/api/hotels", hotelId, "purchases"],
    enabled: !!hotelId,
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Banknote className="h-8 w-8 text-blue-600" />
              Storico Acquisti Crediti
            </h1>
            <p className="text-gray-600 mt-2">
              Visualizza tutti i tuoi acquisti crediti e il loro stato di elaborazione
            </p>
          </div>
        </div>

        {/* Purchase History */}
        {Array.isArray(creditPurchases) && creditPurchases.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <h4 className="font-medium mb-4 text-blue-900">📊 Riepilogo Generale</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-medium text-green-700">Approvati</p>
                    <p className="text-2xl font-bold text-green-800">
                      {creditPurchases.filter((p: any) => p.status === 'approved').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-2">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium text-orange-700">In Attesa</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {creditPurchases.filter((p: any) => p.status === 'pending').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-2">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="font-medium text-red-700">Rifiutati</p>
                    <p className="text-2xl font-bold text-red-800">
                      {creditPurchases.filter((p: any) => p.status === 'rejected').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-2">
                      <Banknote className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-medium text-blue-700">Totale Speso</p>
                    <p className="text-2xl font-bold text-blue-800">
                      €{creditPurchases.filter((p: any) => p.status === 'approved').reduce((sum: number, p: any) => sum + p.packagePrice, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase List */}
            <div className="space-y-4">
              {creditPurchases.map((purchase: any) => {
                const packageNames = {
                  basic: "Pacchetto Base",
                  standard: "Pacchetto Standard", 
                  premium: "Pacchetto Premium",
                  business: "Pacchetto Business",
                  enterprise: "Pacchetto Enterprise"
                };
                
                const statusColors = {
                  pending: "bg-orange-50 border-orange-200 text-orange-700",
                  approved: "bg-green-50 border-green-200 text-green-700",
                  rejected: "bg-red-50 border-red-200 text-red-700"
                };
                
                const statusLabels = {
                  pending: "In Attesa",
                  approved: "Approvato",
                  rejected: "Rifiutato"
                };
                
                const statusIcons = {
                  pending: <Clock className="h-4 w-4" />,
                  approved: <CheckCircle className="h-4 w-4" />,
                  rejected: <AlertCircle className="h-4 w-4" />
                };
                
                return (
                  <Card key={purchase.id} className={`${statusColors[purchase.status as keyof typeof statusColors]} border-l-4`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {packageNames[purchase.packageType as keyof typeof packageNames] || purchase.packageType}
                            </h3>
                            <Badge 
                              variant={purchase.status === 'approved' ? 'default' : purchase.status === 'rejected' ? 'destructive' : 'secondary'}
                              className="flex items-center gap-1 text-sm px-3 py-1"
                            >
                              {statusIcons[purchase.status as keyof typeof statusIcons]}
                              {statusLabels[purchase.status as keyof typeof statusLabels]}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <p className="font-medium text-gray-700 mb-1">💰 Importo</p>
                              <p className="text-2xl font-bold text-gray-900">€{purchase.packagePrice}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <p className="font-medium text-gray-700 mb-1">🎯 Crediti</p>
                              <p className="text-2xl font-bold text-gray-900">{purchase.creditsAmount}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                              <p className="font-medium text-gray-700 mb-1">📅 Data Ordine</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {new Date(purchase.createdAt).toLocaleDateString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(purchase.createdAt).toLocaleTimeString('it-IT', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Additional Details */}
                          {(purchase.processedAt || purchase.processedBy || purchase.notes) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {purchase.processedAt && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <p className="font-medium text-gray-700 mb-1">⏰ Data Elaborazione</p>
                                  <p className="font-semibold text-gray-900">
                                    {new Date(purchase.processedAt).toLocaleDateString('it-IT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              )}
                              {purchase.processedBy && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <p className="font-medium text-gray-700 mb-1">👤 Elaborato da</p>
                                  <p className="font-semibold text-gray-900">{purchase.processedBy}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {purchase.notes && (
                            <div className="bg-white p-4 rounded-lg border mb-4">
                              <p className="font-medium text-gray-700 mb-2">📝 Note Amministratore</p>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded border-l-4 border-blue-200">
                                {purchase.notes}
                              </p>
                            </div>
                          )}
                          
                          {/* Status Messages */}
                          {purchase.status === 'pending' && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-blue-800">
                                ℹ️ <strong>In elaborazione:</strong> Il tuo bonifico è in attesa di verifica. 
                                I crediti saranno attivati entro 24 ore dall'approvazione.
                              </p>
                            </div>
                          )}
                          
                          {purchase.status === 'approved' && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-green-800">
                                ✅ <strong>Bonifico approvato:</strong> I {purchase.creditsAmount} crediti sono stati aggiunti al tuo account.
                              </p>
                            </div>
                          )}
                          
                          {purchase.status === 'rejected' && (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-red-800">
                                ❌ <strong>Bonifico rifiutato:</strong> Contatta il supporto per maggiori informazioni.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Banknote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessun acquisto effettuato
              </h3>
              <p className="text-gray-600 mb-6">
                Non hai ancora effettuato acquisti di crediti. Inizia ad acquistare crediti per generare itinerari per i tuoi ospiti.
              </p>
              <Link href="/dashboard">
                <Button>
                  Vai alla Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PurchaseHistory() {
  return (
    <ProtectedRoute requiredRole="hotel">
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <PurchaseHistoryContent />
      </div>
    </ProtectedRoute>
  );
}