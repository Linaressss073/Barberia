import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function main(): Promise<void> {
  const uri = process.env.DATABASE_URL ?? '';
  const email = process.env.ADMIN_EMAIL ?? 'admin@barberia.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin12345';
  const fullName = process.env.ADMIN_NAME ?? 'Administrador';
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  await mongoose.connect(uri);
  try {
    const db = mongoose.connection.db!;
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`[seed] Admin already exists: ${email}`);
      return;
    }
    const hash = await bcrypt.hash(password, rounds);
    await db.collection('users').insertOne({
      _id: uuidv4() as unknown as mongoose.Types.ObjectId,
      email,
      fullName,
      passwordHash: hash,
      status: 'ACTIVE',
      roles: ['ADMIN'],
      lastLoginAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // eslint-disable-next-line no-console
    console.log(`[seed] Admin created: ${email}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});
