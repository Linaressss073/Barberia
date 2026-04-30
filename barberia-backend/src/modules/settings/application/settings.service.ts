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
    return this.model.find().sort({ key: 1 });
  }

  getOne(key: string): Promise<SettingDocument | null> {
    return this.model.findOne({ key });
  }

  async upsert(key: string, value: unknown): Promise<SettingDocument> {
    const ctx = requestContext.get();
    const doc = await this.model.findOneAndUpdate(
      { key },
      {
        $set: { value, updatedBy: ctx?.userId ?? null, updatedAt: new Date() },
        $setOnInsert: { _id: uuidv4(), key },
      },
      { upsert: true, new: true },
    );
    return doc!;
  }
}
