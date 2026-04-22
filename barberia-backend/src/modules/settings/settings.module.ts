import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingOrmEntity } from './infrastructure/setting.orm-entity';
import { SettingsService } from './application/settings.service';
import { SettingsController } from './presentation/settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SettingOrmEntity])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
