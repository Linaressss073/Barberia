import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';

dotenv.config();

/**
 * Seed mínimo: crea (si no existe) un usuario administrador.
 * Idempotente: usar varias veces sin duplicar.
 *
 * Uso:
 *   ADMIN_EMAIL=admin@barberia.com ADMIN_PASSWORD=Admin123! npm run seed:run
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@barberia.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin12345';
  const fullName = process.env.ADMIN_NAME ?? 'Administrador';
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  await dataSource.initialize();
  try {
    const exists = await dataSource.query(`SELECT 1 FROM users WHERE email = $1 LIMIT 1`, [email]);
    if (exists.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[seed] Admin already exists: ${email}`);
      return;
    }
    const hash = await bcrypt.hash(password, rounds);
    await dataSource.query(
      `INSERT INTO users (email, full_name, password_hash, status, roles)
       VALUES ($1, $2, $3, 'ACTIVE', ARRAY['ADMIN'])`,
      [email, fullName, hash],
    );
    // eslint-disable-next-line no-console
    console.log(`[seed] Admin created: ${email} (password from env or default)`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});
