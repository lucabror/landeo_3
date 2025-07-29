import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import landeoLogo from "@assets/landeo def_1753695256255.png";
import Footer from "@/components/footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div>
                  <img 
                    src={landeoLogo} 
                    alt="Landeo" 
                    className="h-12 w-auto block"
                  />
                  <div className="w-full h-px bg-gray-200 my-2"></div>
                  <p className="text-xs text-amber-700 font-medium tracking-wide whitespace-nowrap">
                    Itinerari su misura, emozioni autentiche
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-amber-700">
                  Accedi
                </Button>
              </Link>
              <Link href="/hotel-register">
                <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                  Inizia Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
              Termini e Condizioni di Utilizzo della Piattaforma "Landeo"
            </h1>
            
            <p className="text-center text-gray-600 mb-8">
              <strong>Ultimo aggiornamento:</strong> [inserire data]
            </p>

            <p className="text-lg text-gray-700 mb-8">
              Benvenuto su Landeo, una piattaforma web che consente la generazione di itinerari turistici personalizzati tramite Intelligenza Artificiale per strutture ricettive italiane.
            </p>

            <p className="text-lg text-gray-700 mb-8">
              Utilizzando la piattaforma, accetti integralmente i seguenti Termini e Condizioni.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Oggetto del Servizio</h2>
            <p className="text-gray-700 mb-4">Landeo è una piattaforma digitale che consente:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>la generazione di itinerari turistici personalizzati tramite AI,</li>
              <li>la gestione di profili ospiti,</li>
              <li>l'invio di PDF e QR code con itinerari personalizzati,</li>
              <li>l'automazione di comunicazioni via email agli ospiti.</li>
            </ul>
            <p className="text-gray-700 mb-6">
              Il servizio è rivolto a strutture ricettive registrate (hotel, resort, agriturismi, B&B ecc.) operanti in Italia.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Registrazione e Utilizzo</h2>
            <p className="text-gray-700 mb-4">
              La registrazione è gratuita. Ogni nuovo utente riceve 5 crediti gratuiti all'attivazione. Ogni itinerario generato consuma 1 credito.
            </p>
            <p className="text-gray-700 mb-4">L'utente che utilizza la piattaforma deve:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>rappresentare legalmente una struttura ricettiva,</li>
              <li>fornire dati veritieri e completi,</li>
              <li>custodire con riservatezza le credenziali di accesso.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Limitazione di Responsabilità</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Accuratezza dei Contenuti Generati</h3>
            <p className="text-gray-700 mb-4">
              La piattaforma utilizza modelli di Intelligenza Artificiale (OpenAI GPT) per generare consigli e itinerari. Landeo non garantisce l'accuratezza o l'idoneità dei contenuti proposti.
            </p>
            <p className="text-gray-700 mb-6">
              È obbligo esclusivo della struttura ricettiva controllare manualmente ogni itinerario generato prima di consegnarlo all'ospite, apportando modifiche ove necessario.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Esonero da Responsabilità</h3>
            <p className="text-gray-700 mb-4">Landeo non è responsabile per danni, disservizi, ritardi, controversie o insoddisfazioni derivanti da:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>uso improprio della piattaforma,</li>
              <li>informazioni errate fornite dall'hotel,</li>
              <li>contenuti non verificati,</li>
              <li>attività proposte non idonee o pericolose.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Interruzione o Modifica del Servizio</h2>
            <p className="text-gray-700 mb-4">Landeo si riserva il diritto di:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>modificare, sospendere o interrompere il servizio, anche senza preavviso,</li>
              <li>rimborsare i crediti non utilizzati in caso di cessazione permanente.</li>
            </ul>
            <p className="text-gray-700 mb-6">
              Non è previsto alcun indennizzo o risarcimento oltre al rimborso dei crediti non utilizzati.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Proprietà Intellettuale</h2>
            <p className="text-gray-700 mb-4">
              Tutti i contenuti, il design, il codice, il marchio e le interfacce della piattaforma sono protetti da copyright.
            </p>
            <p className="text-gray-700 mb-6">
              È vietata ogni riproduzione, distribuzione, modifica o uso non autorizzato.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Trattamento dei Dati Personali</h2>
            <p className="text-gray-700 mb-4">
              <strong>Titolare del Trattamento Dati:</strong><br />
              Dr. Luca Borro – Via di Contrada Comune 159, 00049 Velletri (RM), Tel.: +39 328 30 93 519.
            </p>
            <p className="text-gray-700 mb-4">
              Il trattamento dei dati personali avviene nel rispetto del Regolamento (UE) 2016/679 (GDPR).
            </p>
            <p className="text-gray-700 mb-4">
              La struttura ricettiva è responsabile dei dati inseriti (es. dati ospiti e preferenze) e si impegna a ottenere il consenso necessario dagli ospiti.
            </p>
            <p className="text-gray-700 mb-6">
              Per maggiori dettagli, si rimanda alla{' '}
              <Link href="/privacy" className="text-amber-700 hover:text-amber-800 underline">
                Informativa Privacy
              </Link>.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Prezzi e Crediti</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>I crediti sono acquistabili in pacchetti prepagati.</li>
              <li>Ogni credito equivale a 1 itinerario generato (1 €).</li>
              <li>I crediti non hanno scadenza, salvo comunicazioni contrarie.</li>
              <li>Il pagamento avviene tramite bonifico bancario.</li>
              <li>Non è previsto alcun canone fisso o obbligo di rinnovo.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Foro Competente</h2>
            <p className="text-gray-700 mb-6">
              Per ogni controversia relativa all'interpretazione o all'esecuzione dei presenti Termini, è competente in via esclusiva il Foro di Roma (Italia).
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contatti</h2>
            <p className="text-gray-700 mb-4">Per qualsiasi richiesta o comunicazione:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Commerciale: info@landeo.it</li>
              <li>Supporto tecnico: supporto@landeo.it</li>
              <li>Telefono (clienti premium): +39.328.30.93.519</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Accettazione</h2>
            <p className="text-gray-700 mb-6">
              L'utilizzo della piattaforma implica l'accettazione completa e incondizionata dei presenti Termini e Condizioni. In caso contrario, l'utilizzo del servizio non sarà consentito.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}