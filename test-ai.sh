#!/bin/bash

echo "🏨 Creazione profilo ospite..."
GUEST_RESPONSE=$(curl -s -X POST http://localhost:5000/api/guest-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Coppia",
    "hotelId": "2b9e6746-b072-4e0b-92a8-0de6f5ea7894",
    "numberOfPeople": 2,
    "referenceName": "Marco e Giulia Romano",
    "checkInDate": "2025-03-15T10:00:00.000Z",
    "checkOutDate": "2025-03-18T12:00:00.000Z",
    "ages": [35, 32],
    "preferences": ["Arte", "Enogastronomia", "Storia", "Relax"],
    "specialRequests": "Allergici ai frutti di mare. Preferenza per esperienze culturali autentiche.",
    "roomNumber": "205"
  }')

echo "Risposta guest: $GUEST_RESPONSE"

# Extract guest ID (using sed since jq is not available)
GUEST_ID=$(echo "$GUEST_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [ ! -z "$GUEST_ID" ]; then
  echo "✅ Profilo ospite creato con ID: $GUEST_ID"
  
  echo "🤖 Generazione itinerario AI..."
  ITINERARY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/itineraries/generate \
    -H "Content-Type: application/json" \
    -d "{
      \"hotelId\": \"2b9e6746-b072-4e0b-92a8-0de6f5ea7894\",
      \"guestProfileId\": \"$GUEST_ID\"
    }")
  
  echo "Risposta itinerario: $ITINERARY_RESPONSE"
  
  # Extract itinerary ID
  ITINERARY_ID=$(echo "$ITINERARY_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  
  if [ ! -z "$ITINERARY_ID" ]; then
    echo "✅ Itinerario AI generato con ID: $ITINERARY_ID"
    
    echo "📱 Generazione QR Code..."
    QR_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/itineraries/$ITINERARY_ID/qr")
    echo "QR Response: $QR_RESPONSE"
    
    echo "📄 Generazione PDF..."
    PDF_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/itineraries/$ITINERARY_ID/pdf")
    echo "PDF Response: $PDF_RESPONSE"
    
    echo "🎉 Demo AI completata!"
  else
    echo "❌ Errore nella creazione dell'itinerario"
  fi
else
  echo "❌ Errore nella creazione del profilo ospite"
fi
