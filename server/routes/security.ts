import type { Express } from "express";
import { DatabaseSecurity, SecurityMonitor } from "../database-security";
import { secureStorage } from "../secure-storage";
import { requireAuth } from "../services/security";

export default function securityRoutes(app: Express) {
  
  /**
   * Database health check endpoint
   */
  app.get("/api/security/health", async (req, res) => {
    try {
      const health = await DatabaseSecurity.healthCheck();
      const connections = DatabaseSecurity.getConnectionStats();
      
      res.json({
        status: health.status,
        latency: health.latency,
        connections,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ 
        status: 'error', 
        error: 'Health check failed' 
      });
    }
  });

  /**
   * Security report endpoint (admin only)
   */
  app.get("/api/security/report", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Only admins can access security reports
      if (user.type !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const report = await SecurityMonitor.generateSecurityReport();
      res.json(report);
    } catch (error) {
      console.error('Security report failed:', error);
      res.status(500).json({ 
        error: 'Failed to generate security report' 
      });
    }
  });

  /**
   * Database backup validation endpoint (admin only)
   */
  app.get("/api/security/backup-status", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (user.type !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const isValid = await DatabaseSecurity.validateBackup();
      res.json({
        valid: isValid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Backup validation failed:', error);
      res.status(500).json({ 
        error: 'Backup validation failed' 
      });
    }
  });

  /**
   * Security lockdown endpoint (admin only)
   */
  app.post("/api/security/lockdown", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { reason } = req.body;
      
      if (user.type !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!reason) {
        return res.status(400).json({ error: "Reason required for lockdown" });
      }

      await secureStorage.emergencyLockdown(reason, user.id);
      
      res.json({
        message: "Emergency lockdown initiated",
        reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lockdown failed:', error);
      res.status(500).json({ 
        error: 'Lockdown operation failed' 
      });
    }
  });

  /**
   * Security metrics endpoint
   */
  app.get("/api/security/metrics", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (user.type !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get basic security metrics
      const metrics = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      };

      res.json(metrics);
    } catch (error) {
      console.error('Metrics collection failed:', error);
      res.status(500).json({ 
        error: 'Failed to collect metrics' 
      });
    }
  });
}