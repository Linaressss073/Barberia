import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { DatabaseConfig } from '@config/database.config';
import { UnitOfWork } from './unit-of-work';

/**
 * Normaliza respuestas: expone `id` (string) y oculta `_id`/`__v` al serializar.
 * Los schemas usan `_id: string` (UUIDs), pero el frontend consume `id`.
 */
mongoose.plugin((schema: mongoose.Schema) => {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret['_id'] != null && ret['id'] == null) ret['id'] = ret['_id'];
      delete ret['_id'];
      return ret;
    },
  });
  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret['_id'] != null && ret['id'] == null) ret['id'] = ret['_id'];
      delete ret['_id'];
      return ret;
    },
  });
});

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<DatabaseConfig>('database').uri,
      }),
    }),
  ],
  providers: [UnitOfWork],
  exports: [UnitOfWork],
})
export class DatabaseModule {}
