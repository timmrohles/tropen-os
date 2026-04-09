import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { writeFileSync } from 'fs';
import { z } from 'zod';

const registry = new OpenAPIRegistry();

// Example API schema - replace with actual API schemas
const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/api/health',
  description: 'Health check endpoint',
  responses: {
    200: {
      description: 'Health check response',
      content: {
        'application/json': {
          schema: HealthCheckSchema,
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const docs = generator.generateDocument({
  openapi: '3.0.0',
  info: { title: 'API Documentation', version: '1.0.0' },
});

writeFileSync('./public/openapi.json', JSON.stringify(docs, null, 2));
console.log('OpenAPI spec generated at ./public/openapi.json');
