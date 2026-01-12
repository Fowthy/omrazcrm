import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create libSQL client - works with both local SQLite and Turso
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data/omraz.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export * from './schema';
