import client from 'prom-client';
import express from 'express';

export const register = new client.Registry();

// Default metrics (CPU, memory, Node.js event loop)
client.collectDefaultMetrics({ register });

// Custom metrics: histogram odzivnosti
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5]
});

register.registerMetric(httpRequestDurationMicroseconds);

// Middleware za merjenje casa requestov
export function metricsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
  });
  next();
}

// Endpoint /metrics za Prometheus scraping
export function metricsEndpoint(app: express.Express) {
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
