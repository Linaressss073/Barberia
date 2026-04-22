import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
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

  @IsBooleanString()
  DATABASE_SSL!: string;

  @IsBooleanString()
  DATABASE_LOGGING!: string;

  @IsInt()
  @Min(1)
  DATABASE_POOL_MAX!: number;

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
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
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
