import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Printer, QrCode, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: any;
  hotel: any;
  guestProfile: any;
}

export function QRModal({ isOpen, onClose, itinerary, hotel, guestProfile }: QRModalProps) {
  const { toast } = useToast();

  const generatePDFMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/itineraries/${itinerary.id}/pdf`);
      return res.json();
    },
    onSuccess: (data) => {
      // Open PDF in new window
      window.open(data.pdfUrl, '_blank');
      toast({
        title: "PDF Generato",
        description: "Il PDF dell'itinerario è stato generato con successo!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la generazione del PDF",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    if (itinerary.qrCodeUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${guestProfile.referenceName}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 40px; 
                  background: #f8f9fa;
                }
                .qr-container { 
                  background: white; 
                  padding: 30px; 
                  border-radius: 15px; 
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  max-width: 400px;
                  margin: 0 auto;
                }
                .hotel-name { 
                  color: #2C5530; 
                  font-size: 24px; 
                  font-weight: bold; 
                  margin-bottom: 10px;
                }
                .welcome-text { 
                  color: #666; 
                  font-size: 16px; 
                  margin-bottom: 20px;
                }
                .guest-name { 
                  color: #8B4513; 
                  font-size: 14px; 
                  font-weight: bold;
                }
                img { 
                  max-width: 200px; 
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="hotel-name">${hotel.name}</div>
                <div class="welcome-text">Benvenuti nella vostra esperienza personalizzata</div>
                <img src="${window.location.origin}${itinerary.qrCodeUrl}" alt="QR Code" />
                <div class="guest-name">${guestProfile.referenceName}</div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5" />
            QR Code Anteprima
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <div className="qr-card p-6 rounded-lg mb-4">
            {itinerary.qrCodeUrl ? (
              <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center">
                <img 
                  src={itinerary.qrCodeUrl} 
                  alt="QR Code" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                <QrCode className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            <div className="text-center">
              <h4 className="font-serif font-semibold text-primary mb-1">
                {hotel?.name || "Hotel"}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Benvenuti nella vostra esperienza personalizzata
              </p>
              <p className="text-xs text-gray-500">
                {guestProfile?.referenceName || "Ospiti"}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => generatePDFMutation.mutate()}
              disabled={generatePDFMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {generatePDFMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica PDF
                </>
              )}
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
              disabled={!itinerary.qrCodeUrl}
            >
              <Printer className="mr-2 h-4 w-4" />
              Stampa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
