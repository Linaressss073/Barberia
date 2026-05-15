/**
 * Seed: 2 barberías demo con servicios distintos
 * node seed-demo.mjs
 */

const API = 'https://barberia-1yoo.onrender.com/api/v1';

const BARBERIAS = [
  {
    owner: { email: 'admin@elcorteclasico.com', password: 'Admin1234!', fullName: 'Carlos Mendoza' },
    businessName: 'El Corte Clásico',
    services: [
      { name: 'Corte clásico',          description: 'Tijera y máquina, acabado impecable',  durationMin: 30, priceCents: 2500000 },
      { name: 'Arreglo de barba',        description: 'Perfilado y definición con navaja',     durationMin: 20, priceCents: 1500000 },
      { name: 'Corte + barba',           description: 'Combo completo con toalla caliente',    durationMin: 50, priceCents: 3500000 },
      { name: 'Afeitado con navaja',     description: 'Afeitado tradicional en caliente',      durationMin: 30, priceCents: 2000000 },
      { name: 'Corte infantil',          description: 'Para niños hasta 12 años',              durationMin: 20, priceCents: 1800000 },
    ],
  },
  {
    owner: { email: 'admin@studiohairbeard.com', password: 'Admin1234!', fullName: 'Andrés Vargas' },
    businessName: 'Studio Hair & Beard',
    services: [
      { name: 'Fade degradado',          description: 'Low, mid o high fade a tu estilo',      durationMin: 40, priceCents: 3000000 },
      { name: 'Diseño de barba',         description: 'Diseño personalizado con líneas limpias', durationMin: 30, priceCents: 2000000 },
      { name: 'Fade + diseño de barba',  description: 'Look completo premium',                  durationMin: 70, priceCents: 4500000 },
      { name: 'Tratamiento capilar',     description: 'Hidratación profunda con productos premium', durationMin: 45, priceCents: 3500000 },
      { name: 'Coloración',             description: 'Tinte completo o mechas',                durationMin: 90, priceCents: 6000000 },
      { name: 'Corte + fade express',    description: 'Servicio rápido para el día a día',      durationMin: 35, priceCents: 2500000 },
    ],
  },
];

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
}

for (const b of BARBERIAS) {
  process.stdout.write(`\n▶ ${b.businessName}\n`);

  // Register (may already exist)
  try {
    await post('/auth/register', { ...b.owner, businessName: b.businessName, plan: 'TRIAL' });
    process.stdout.write(`  ✓ owner registrado\n`);
  } catch (e) {
    if (e.message.includes('already registered')) {
      process.stdout.write(`  ℹ owner ya existe\n`);
    } else {
      console.error(`  ✗ register: ${e.message}`);
      continue;
    }
  }

  // Login
  let token;
  try {
    const login = await post('/auth/login', { email: b.owner.email, password: b.owner.password });
    token = login.tokens.accessToken;
    process.stdout.write(`  ✓ login OK\n`);
  } catch (e) {
    console.error(`  ✗ login: ${e.message}`);
    continue;
  }

  // Create services
  for (const svc of b.services) {
    try {
      await post('/services', svc, token);
      process.stdout.write(`  ✓ servicio: ${svc.name}\n`);
    } catch (e) {
      process.stdout.write(`  ✗ servicio ${svc.name}: ${e.message}\n`);
    }
  }
}

process.stdout.write('\n✅ Seed completado\n');
