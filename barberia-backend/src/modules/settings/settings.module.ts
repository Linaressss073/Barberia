import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingDoc, SettingSchema } from './infrastructure/setting.schema';
import { SettingsService } from './application/settings.service';
import { SettingsController } from './presentation/settings.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: SettingDoc.name, schema: SettingSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
