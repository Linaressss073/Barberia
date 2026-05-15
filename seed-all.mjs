/**
 * Seed completo: 4 barberías con barberos y servicios
 * node seed-all.mjs
 */

const API = 'https://barberia-1yoo.onrender.com/api/v1';

const BARBERIAS = [
  {
    owner: { email: 'admin@elcorteclasico.com', password: 'Admin1234!', fullName: 'Carlos Mendoza' },
    businessName: 'El Corte Clásico',
    services: [
      { name: 'Corte clásico',       durationMin: 30, priceCents: 2500000, description: 'Tijera y máquina, acabado impecable' },
      { name: 'Arreglo de barba',    durationMin: 20, priceCents: 1500000, description: 'Perfilado y definición con navaja' },
      { name: 'Corte + barba',       durationMin: 50, priceCents: 3500000, description: 'Combo completo con toalla caliente' },
      { name: 'Afeitado con navaja', durationMin: 30, priceCents: 2000000, description: 'Afeitado tradicional en caliente' },
      { name: 'Corte infantil',      durationMin: 20, priceCents: 1800000, description: 'Para niños hasta 12 años' },
    ],
    barbers: [
      { email: 'carlos@elcorteclasico.com', fullName: 'Carlos Mendoza',    displayName: 'Carlos Mendoza',    specialty: 'Cortes clásicos y afeitado', commissionPct: 40 },
      { email: 'diego@elcorteclasico.com',  fullName: 'Diego Ríos',        displayName: 'Diego Ríos',        specialty: 'Barbas y diseños',            commissionPct: 38 },
      { email: 'sebas@elcorteclasico.com',  fullName: 'Sebastián Torres',  displayName: 'Sebastián Torres',  specialty: 'Cortes infantiles',           commissionPct: 35 },
    ],
    barberSchedules: weekdays(9, 18),
  },
  {
    owner: { email: 'admin@studiohairbeard.com', password: 'Admin1234!', fullName: 'Andrés Vargas' },
    businessName: 'Studio Hair & Beard',
    services: [
      { name: 'Fade degradado',         durationMin: 40, priceCents: 3000000, description: 'Low, mid o high fade a tu estilo' },
      { name: 'Diseño de barba',        durationMin: 30, priceCents: 2000000, description: 'Diseño personalizado con líneas limpias' },
      { name: 'Fade + diseño de barba', durationMin: 70, priceCents: 4500000, description: 'Look completo premium' },
      { name: 'Tratamiento capilar',    durationMin: 45, priceCents: 3500000, description: 'Hidratación profunda con productos premium' },
      { name: 'Coloración',             durationMin: 90, priceCents: 6000000, description: 'Tinte completo o mechas' },
      { name: 'Corte + fade express',   durationMin: 35, priceCents: 2500000, description: 'Servicio rápido para el día a día' },
    ],
    barbers: [
      { email: 'andres@studiohairbeard.com', fullName: 'Andrés Vargas',    displayName: 'Andrés Vargas',    specialty: 'Fades y degradados',          commissionPct: 45 },
      { email: 'mateo@studiohairbeard.com',  fullName: 'Mateo Gómez',      displayName: 'Mateo Gómez',      specialty: 'Coloración y tratamientos',   commissionPct: 42 },
      { email: 'felipe@studiohairbeard.com', fullName: 'Felipe Castillo',  displayName: 'Felipe Castillo',  specialty: 'Diseños y líneas',            commissionPct: 38 },
    ],
    barberSchedules: weekdays(10, 20),
  },
  {
    owner: { email: 'admin@barberiadejemplo.com', password: 'Admin1234!', fullName: 'Juan Barbero' },
    businessName: 'Barberia de ejemplo',
    services: [
      { name: 'Corte básico',    durationMin: 25, priceCents: 2000000, description: 'Corte sencillo y rápido' },
      { name: 'Barba express',   durationMin: 15, priceCents: 1200000, description: 'Arreglo rápido de barba' },
      { name: 'Combo completo',  durationMin: 45, priceCents: 3000000, description: 'Corte y barba' },
      { name: 'Cabello + cejas', durationMin: 35, priceCents: 2500000, description: 'Corte con diseño de cejas' },
    ],
    barbers: [
      { email: 'juan@barberiadejemplo.com', fullName: 'Juan Barbero', displayName: 'Juan Barbero', specialty: 'Cortes clásicos', commissionPct: 40 },
      { email: 'luis@barberiadejemplo.com', fullName: 'Luis Pérez',   displayName: 'Luis Pérez',   specialty: 'Barbas',          commissionPct: 35 },
    ],
    barberSchedules: weekdays(9, 18),
  },
  {
    owner: { email: 'admin@barberiasevera.com', password: 'Admin1234!', fullName: 'Pedro Severo' },
    businessName: 'Barberia la severa',
    services: [
      { name: 'Corte profesional',    durationMin: 35, priceCents: 2800000, description: 'Corte con acabado profesional' },
      { name: 'Barba estilo',         durationMin: 25, priceCents: 1800000, description: 'Barba con estilo definido' },
      { name: 'Paquete VIP',          durationMin: 60, priceCents: 4500000, description: 'Corte + barba + hidratación' },
      { name: 'Corte degradado',      durationMin: 40, priceCents: 3200000, description: 'Degradado limpio a toda máquina' },
      { name: 'Diseño personalizado', durationMin: 50, priceCents: 3800000, description: 'Tu estilo único' },
    ],
    barbers: [
      { email: 'pedro@barberiasevera.com',  fullName: 'Pedro Severo',    displayName: 'Pedro Severo',    specialty: 'Cortes modernos',        commissionPct: 45 },
      { email: 'camilo@barberiasevera.com', fullName: 'Camilo Rojas',    displayName: 'Camilo Rojas',    specialty: 'Degradados',             commissionPct: 40 },
      { email: 'nico@barberiasevera.com',   fullName: 'Nicolás Herrera', displayName: 'Nicolás Herrera', specialty: 'Diseños y artístico',    commissionPct: 38 },
    ],
    barberSchedules: weekdays(9, 19),
  },
];

function weekdays(startH, endH) {
  return [1,2,3,4,5,6].map(weekday => ({
    weekday,
    startTime: `${String(startH).padStart(2,'0')}:00`,
    endTime:   `${String(endH).padStart(2,'0')}:00`,
  }));
}

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json.data ?? json;
}

const post = (path, body, token) => request('POST', path, body, token);

for (const b of BARBERIAS) {
  console.log(`\n▶ ${b.businessName}`);

  // Register (may already exist)
  try {
    await post('/auth/register', { ...b.owner, businessName: b.businessName, plan: 'TRIAL' });
    console.log(`  ✓ admin registrado`);
  } catch (e) {
    if (e.message.includes('409') || e.message.includes('already') || e.message.includes('registrado')) {
      console.log(`  ℹ admin ya existe`);
    } else {
      console.error(`  ✗ register: ${e.message}`);
      continue;
    }
  }

  // Login
  let token;
  try {
    const login = await post('/auth/login', { email: b.owner.email, password: b.owner.password });
    token = login.tokens?.accessToken ?? login.accessToken;
    console.log(`  ✓ login OK`);
  } catch (e) {
    console.error(`  ✗ login: ${e.message}`);
    continue;
  }

  // Create services
  for (const svc of b.services) {
    try {
      await post('/services', svc, token);
      console.log(`  ✓ servicio: ${svc.name}`);
    } catch (e) {
      const msg = e.message;
      if (msg.includes('409') || msg.includes('already') || msg.includes('existe')) {
        console.log(`  ℹ servicio ya existe: ${svc.name}`);
      } else {
        console.log(`  ✗ servicio ${svc.name}: ${msg}`);
      }
    }
  }

  // Create barber users + barber profiles
  for (const barber of b.barbers) {
    let userId;

    // Create user with BARBER role
    try {
      const u = await post('/users', {
        email: barber.email,
        fullName: barber.fullName,
        password: 'Barber123!',
        roles: ['BARBER'],
      }, token);
      userId = u.id ?? u._id;
      console.log(`  ✓ usuario barbero: ${barber.fullName}`);
    } catch (e) {
      const msg = e.message;
      if (msg.includes('409') || msg.includes('already') || msg.includes('existe')) {
        // Try to find existing user
        try {
          const existing = await request('GET', `/users/lookup?email=${encodeURIComponent(barber.email)}`, null, token);
          userId = existing?.id ?? existing?._id;
          console.log(`  ℹ usuario ya existe: ${barber.fullName}`);
        } catch {
          console.log(`  ✗ no se pudo obtener usuario: ${barber.fullName}`);
          continue;
        }
      } else {
        console.log(`  ✗ usuario ${barber.fullName}: ${msg}`);
        continue;
      }
    }

    if (!userId) { console.log(`  ✗ sin userId para: ${barber.fullName}`); continue; }

    // Create barber profile
    try {
      await post('/barbers', {
        userId,
        displayName: barber.displayName,
        specialty: barber.specialty,
        commissionPct: barber.commissionPct,
        schedules: b.barberSchedules,
      }, token);
      console.log(`  ✓ perfil barbero: ${barber.displayName}`);
    } catch (e) {
      const msg = e.message;
      if (msg.includes('409') || msg.includes('already') || msg.includes('existe')) {
        console.log(`  ℹ perfil barbero ya existe: ${barber.displayName}`);
      } else {
        console.log(`  ✗ perfil ${barber.displayName}: ${msg}`);
      }
    }
  }
}

console.log('\n✅ Seed completado');
