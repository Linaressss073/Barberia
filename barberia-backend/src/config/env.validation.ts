import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Staging = 'staging',
  Production = 'production',
}

/**
 * Cargado al boot. Si una variable obligatoria falta o es inválida,
 * el proceso se cae ANTES de aceptar tráfico (fail-fast).
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  APP_NAME!: string;

  @IsString()
  APP_VERSION!: string;

  @IsString()
  GLOBAL_PREFIX!: string;

  @IsString()
  FRONTEND_URL!: string;

  @IsString()
  @MinLength(20)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_ACCESS_TTL!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_TTL!: string;

  @IsInt()
  @Min(8)
  BCRYPT_SALT_ROUNDS!: number;

  @IsInt()
  @Min(1)
  THROTTLE_TTL_MS!: number;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT!: number;

  @IsOptional()
  @IsString()
  EMAIL_API_KEY?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_API_KEY?: string;

  @IsOptional()
  @IsString()
  GMAIL_USER?: string;

  @IsOptional()
  @IsString()
  GMAIL_APP_PASSWORD?: string;

  @IsOptional()
  @IsString()
  MAIL_FROM?: string;
}

/**
 * Nest puede pasar a `validate()` solo el resultado del merge interno (.env + loader),
 * sin incluir todas las claves de `process.env`. En Render las variables se inyectan en el
 * proceso; deben prevalecer sobre huecos del objeto recibido.
 */
function mergeWithRuntimeEnv(config: Record<string, unknown>): Record<string, unknown> {
  return {
    ...config,
    ...(process.env as Record<string, unknown>),
  };
}

/** Valores por defecto solo para variables que también tienen fallback en app.config (boot sin .env en algunos PaaS). */
function applyEnvDefaults(config: Record<string, unknown>): Record<string, unknown> {
  const out = { ...config };
  const fe = out['FRONTEND_URL'];
  if (fe == null || fe === '') {
    out['FRONTEND_URL'] = 'http://localhost:4321';
  }
  return out;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const merged = applyEnvDefaults(mergeWithRuntimeEnv(config));
  const validated = plainToInstance(EnvironmentVariables, merged, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const formatted = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }
  return validated;
}
