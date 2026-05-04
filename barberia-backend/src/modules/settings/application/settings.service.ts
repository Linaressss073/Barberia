import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '@core/context/request-context';
import { SettingDoc, SettingDocument } from '../infrastructure/setting.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(SettingDoc.name) private readonly model: Model<SettingDocument>) {}

  getAll(): Promise<SettingDocument[]> {
    const tenantId = requestContext.get()?.tenantId;
    const q: Record<string, unknown> = {};
    if (tenantId) q['tenantId'] = tenantId;
    else q['tenantId'] = null;
    return this.model.find(q).sort({ key: 1 });
  }

  getOne(key: string): Promise<SettingDocument | null> {
    const tenantId = requestContext.get()?.tenantId;
    const q: Record<string, unknown> = { key };
    if (tenantId) q['tenantId'] = tenantId;
    else q['tenantId'] = null;
    return this.model.findOne(q);
  }

  async upsert(key: string, value: unknown): Promise<SettingDocument> {
    const ctx = requestContext.get();
    const tenantId = ctx?.tenantId ?? null;
    const filter: Record<string, unknown> = { key, tenantId };
    const doc = await this.model.findOneAndUpdate(
      filter,
      {
        $set: { value, updatedBy: ctx?.userId ?? null, updatedAt: new Date() },
        $setOnInsert: { _id: uuidv4(), key, tenantId },
      },
      { upsert: true, new: true },
    );
    return doc!;
  }
}
