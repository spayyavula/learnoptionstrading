import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { checkDatabaseHealth } from '../lib/database';
import { jsonResponse, serverError } from '../lib/response';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    api: boolean;
    database: boolean;
  };
}

export async function health(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const dbHealthy = await checkDatabaseHealth();

    const status: HealthStatus = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        database: dbHealthy,
      },
    };

    return jsonResponse(status, dbHealthy ? 200 : 503);
  } catch (error) {
    context.error('Health check failed:', error);
    return serverError('Health check failed');
  }
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: health,
});
