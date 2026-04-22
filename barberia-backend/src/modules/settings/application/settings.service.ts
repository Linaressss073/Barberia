import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { requestContext } from '@core/context/request-context';
import { SettingOrmEntity } from '../infrastructure/setting.orm-entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingOrmEntity) private readonly repo: Repository<SettingOrmEntity>,
  ) {}

  async getAll(): Promise<SettingOrmEntity[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async getOne(key: string): Promise<SettingOrmEntity | null> {
    return this.repo.findOne({ where: { key } });
  }

  async upsert(key: string, value: unknown): Promise<SettingOrmEntity> {
    const ctx = requestContext.get();
    const existing = await this.repo.findOne({ where: { key } });
    const entity = existing ?? new SettingOrmEntity();
    entity.key = key;
    entity.value = value as SettingOrmEntity['value'];
    entity.updatedBy = ctx?.userId ?? null;
    await this.repo.save(entity);
    return entity;
  }
}
