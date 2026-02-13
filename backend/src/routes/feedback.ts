import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateFeedback } from '../services/gemini.js';
import { randomUUID } from 'crypto';

const FeedbackRequestSchema = z.object({
  journal_text: z.string().min(1).max(1000),
  mood: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(7).optional(),
  language: z.string().default('ja'),
  timezone: z.string().default('Asia/Tokyo'),
});

export async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/feedback', async (request, reply) => {
    const requestId = randomUUID();
    const startTime = Date.now();

    try {
      // Validate request body
      const body = FeedbackRequestSchema.parse(request.body);

      // Log request metadata (NEVER log journal_text)
      fastify.log.info({
        request_id: requestId,
        text_length: body.journal_text.length,
        mood: body.mood,
        stress: body.stress,
        language: body.language,
      });

      // Generate feedback using Gemini
      const feedback = await generateFeedback(
        body.journal_text,
        body.language,
        body.mood,
        body.stress
      );

      const duration = Date.now() - startTime;

      // Log response metadata
      fastify.log.info({
        request_id: requestId,
        duration_ms: duration,
        risk_score: feedback.risk_score,
        has_safety_note: feedback.safety_note !== null,
      });

      return reply.status(200).send(feedback);
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof z.ZodError) {
        fastify.log.warn({
          request_id: requestId,
          duration_ms: duration,
          error: 'validation_error',
          details: error.errors,
        });

        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error({
        request_id: requestId,
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to generate feedback. Please try again later.',
      });
    }
  });

  fastify.get('/healthz', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });
}
