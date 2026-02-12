import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { feedbackRoutes } from './routes/feedback.js';

const PORT = parseInt(process.env.PORT || '8080');
const HOST = '0.0.0.0';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// CORS configuration
await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost')) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});

// Rate limiting
await fastify.register(rateLimit, {
  max: 20, // 20 requests
  timeWindow: '1 minute',
  errorResponseBuilder: () => {
    return {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    };
  },
});

// Register routes
await fastify.register(feedbackRoutes);

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`Server listening on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, closing server...`);
    await fastify.close();
    process.exit(0);
  });
});
