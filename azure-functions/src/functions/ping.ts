import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function ping(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  return {
    status: 200,
    jsonBody: { message: 'pong from auth folder' }
  };
}

app.http('authPing', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'authtest/ping',
  handler: ping,
});
