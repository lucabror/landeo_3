import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Security middleware con configurazione separata per dev/prod
if (process.env.NODE_ENV === 'development') {
  // Configurazione CSP permissiva per development (Vite richiede unsafe-eval e inline)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
    hsts: false, // Disabilitato in development
  }));
} else {
  // Configurazione CSP restrittiva per produzione
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));
}

// Rate limiting migliorato
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Ridotto da 1000 a 500 requests per IP
  message: 'Troppi tentativi da questo IP, riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting per file statici
    return req.path.startsWith('/uploads/') || 
           req.path.startsWith('/assets/') ||
           req.path.includes('.');
  }
});

const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 5, // Ridotto da 10 a 5 auth attempts per IP
  message: 'Troppi tentativi di accesso, riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false,
  // Rimosso keyGenerator personalizzato per evitare problemi IPv6
});

app.use('/api/auth', authLimiter);
app.use(limiter);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Servire i file caricati (loghi) staticamente
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log errore per debugging interno senza esporre dettagli
    log(`Error ${status} on ${req.method} ${req.path}: ${err.message}`);
    
    // Messaggi di errore generici per il cliente
    let message = "Internal Server Error";
    if (status === 400) message = "Richiesta non valida";
    else if (status === 401) message = "Accesso non autorizzato";
    else if (status === 403) message = "Accesso negato";
    else if (status === 404) message = "Risorsa non trovata";
    else if (status === 429) message = "Troppi tentativi, riprova più tardi";
    else if (status === 500) message = "Errore interno del server";

    res.status(status).json({ message });
    
    // Solo in development mostra stack trace nella console
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
