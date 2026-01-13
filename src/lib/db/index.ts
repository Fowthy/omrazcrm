import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient, Client } from '@libsql/client';
import * as schema from './schema';

// Lazy-loaded database client to avoid edge runtime issues with file:// URLs
let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || 'file:./data/omraz.db',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

function getDatabase(): LibSQLDatabase<typeof schema> {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

// Export db as a proxy that lazily initializes on first access
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(target, prop) {
    const database = getDatabase();
    const value = database[prop as keyof typeof database];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  },
});

export * from './schema';
