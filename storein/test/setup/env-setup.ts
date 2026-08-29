// Runs in each Jest worker process — supplements the env vars set in global-setup.ts.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

// Suppress ECONNREFUSED unhandled rejections that occur during supertest teardown
// when the NestJS HTTP server closes while a connection attempt is in-flight.
process.on('unhandledRejection', (reason: unknown) => {
  if (
    reason &&
    typeof reason === 'object' &&
    'code' in reason &&
    (reason as { code?: unknown }).code === 'ECONNREFUSED'
  ) {
    return;
  }
  throw reason;
});
