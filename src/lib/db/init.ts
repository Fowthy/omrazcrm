import { db, users, bandSettings } from './index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export async function initializeDatabase() {
  // Check if admin user exists
  const existingUsers = await db.select().from(users).limit(1);

  if (existingUsers.length === 0) {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    await db.insert(users).values({
      id: nanoid(),
      email: 'admin@omraz.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      instrument: 'All',
    });

    console.log('Default admin user created: admin@omraz.com / admin123');
  }

  // Check if band settings exist
  const existingSettings = await db.select().from(bandSettings).where(eq(bandSettings.id, 'default')).limit(1);

  if (existingSettings.length === 0) {
    await db.insert(bandSettings).values({
      id: 'default',
      name: 'Omraz',
      primaryColor: '#8B5CF6',
      secondaryColor: '#06B6D4',
      timezone: 'UTC',
      currency: 'USD',
    });

    console.log('Default band settings created');
  }
}
