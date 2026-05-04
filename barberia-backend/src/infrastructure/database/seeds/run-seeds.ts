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

  const conn = await mongoose.connect(uri);
  try {
    const db = conn.connection.db!;

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`[seed] Admin already exists: ${email}`);
    } else {
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
    }

    await seedServices(db);
    await seedBarbers(db, rounds);
  } finally {
    await mongoose.disconnect();
  }
}

async function seedServices(db: mongoose.mongo.Db): Promise<void> {
  const count = await db.collection('services').countDocuments({ deletedAt: null });
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[seed] Services already exist (${count}), skipping`);
    return;
  }

  const services = [
    { name: 'Corte de cabello', description: 'Corte clásico personalizado según tu estilo', durationMin: 30, priceCents: 2500000 },
    { name: 'Corte + Barba', description: 'Corte de cabello y arreglo de barba completo', durationMin: 45, priceCents: 3500000 },
    { name: 'Arreglo de barba', description: 'Perfilado y arreglo de barba con navaja', durationMin: 20, priceCents: 1500000 },
    { name: 'Afeitado clásico', description: 'Afeitado tradicional con espuma caliente y navaja', durationMin: 30, priceCents: 2000000 },
    { name: 'Corte infantil', description: 'Corte de cabello para niños hasta 12 años', durationMin: 20, priceCents: 1800000 },
    { name: 'Tinte de cabello', description: 'Coloración completa con productos premium', durationMin: 90, priceCents: 8000000 },
  ];

  const now = new Date();
  const docs = services.map(s => ({
    _id: uuidv4() as unknown as mongoose.Types.ObjectId,
    ...s,
    active: true,
    promotions: [],
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  await db.collection('services').insertMany(docs);
  // eslint-disable-next-line no-console
  console.log(`[seed] Created ${docs.length} services`);
}

async function seedBarbers(db: mongoose.mongo.Db, rounds: number): Promise<void> {
  const count = await db.collection('barbers').countDocuments();
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[seed] Barbers already exist (${count}), skipping`);
    return;
  }

  const barberData = [
    {
      email: 'carlos@barberia.com',
      fullName: 'Carlos Martínez',
      displayName: 'Carlos',
      specialty: 'Cortes clásicos y fades',
      commissionPct: '15.00',
      // Lun-Sab 9:00-18:00
      weekdays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '18:00',
    },
    {
      email: 'miguel@barberia.com',
      fullName: 'Miguel Torres',
      displayName: 'Miguel',
      specialty: 'Barba y afeitado clásico',
      commissionPct: '15.00',
      // Lun-Vie 10:00-19:00
      weekdays: [1, 2, 3, 4, 5],
      startTime: '10:00',
      endTime: '19:00',
    },
    {
      email: 'andres@barberia.com',
      fullName: 'Andrés López',
      displayName: 'Andrés',
      specialty: 'Degradados y diseños',
      commissionPct: '20.00',
      // Mar-Dom 9:00-17:00
      weekdays: [2, 3, 4, 5, 6, 0],
      startTime: '09:00',
      endTime: '17:00',
    },
  ];

  const now = new Date();
  const hireDate = new Date('2024-01-01');
  const barberPassword = await bcrypt.hash('Barbero123', rounds);

  for (const b of barberData) {
    const existingUser = await db.collection('users').findOne({ email: b.email });
    let userId: string;

    if (existingUser) {
      userId = existingUser._id as unknown as string;
      // eslint-disable-next-line no-console
      console.log(`[seed] Barber user already exists: ${b.email}`);
    } else {
      userId = uuidv4();
      await db.collection('users').insertOne({
        _id: userId as unknown as mongoose.Types.ObjectId,
        email: b.email,
        fullName: b.fullName,
        passwordHash: barberPassword,
        status: 'ACTIVE',
        roles: ['BARBER'],
        lastLoginAt: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    const barberId = uuidv4();
    await db.collection('barbers').insertOne({
      _id: barberId as unknown as mongoose.Types.ObjectId,
      userId,
      displayName: b.displayName,
      specialty: b.specialty,
      hireDate,
      commissionPct: b.commissionPct,
      active: true,
      ratingAvg: '0.00',
      schedules: b.weekdays.map(weekday => ({
        weekday,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      createdAt: now,
      updatedAt: now,
    });

    // eslint-disable-next-line no-console
    console.log(`[seed] Barber created: ${b.displayName} (${b.email})`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});
