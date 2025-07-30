import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PreviewOGImage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Anteprima Immagine Social Media
          </h1>
          <p className="text-gray-600 mb-6">
            Questa è l'immagine che apparirà quando condividerai la homepage di Landeo su Facebook, LinkedIn e altri social media.
          </p>
          <Link href="/">
            <Button variant="outline">← Torna alla Homepage</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Immagine Open Graph (1200x630px)</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img 
              src="/og-image.svg" 
              alt="Landeo - Piattaforma AI per hotel italiani" 
              className="w-full h-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Informazioni:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Dimensioni: 1200x630 pixel (standard per Facebook/LinkedIn)</li>
              <li>• Formato: SVG vettoriale (si ridimensiona perfettamente)</li>
              <li>• Include: Logo Landeo, tagline, descrizione e call-to-action</li>
              <li>• Colori: Palette brand Landeo (amber/oro)</li>
              <li>• Testo: Ottimizzato per leggibilità su social media</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Come testare:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Vai su <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Debugger</a></li>
              <li>2. Inserisci URL: https://landeo.it</li>
              <li>3. Clicca "Debug" per vedere l'anteprima</li>
              <li>4. Per LinkedIn: usa <a href="https://www.linkedin.com/post-inspector/" target="_blank" rel="noopener noreferrer" className="underline">LinkedIn Post Inspector</a></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}