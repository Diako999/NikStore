import type { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var __MONGOD__: MongoMemoryServer | undefined;
}

export default async function globalTeardown(): Promise<void> {
  const mongod = global.__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
}
