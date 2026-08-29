import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SiteSettings,
  SiteSettingsDocument,
} from './entities/site-settings.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const SINGLETON_KEY = 'default';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SiteSettings.name)
    private settingsModel: Model<SiteSettingsDocument>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SettingsService.name);
  }

  async findSettings(): Promise<SiteSettingsDocument> {
    const doc = await this.settingsModel
      .findOne({ _key: SINGLETON_KEY })
      .select('-__v -_key')
      .lean<SiteSettingsDocument>();

    if (doc) return doc;

    this.logger.log('Site settings not found — bootstrapping with defaults');
    return this.settingsModel.create({ _key: SINGLETON_KEY });
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<SiteSettingsDocument> {
    const doc = await this.settingsModel
      .findOneAndUpdate(
        { _key: SINGLETON_KEY },
        { $set: dto },
        { new: true, upsert: true, runValidators: true },
      )
      .select('-__v -_key')
      .lean<SiteSettingsDocument>();

    this.logger.log('Site settings updated', {
      fields: Object.keys(dto),
      hasSocial: !!dto.social,
      footerLinksCount: dto.footerLinks?.length ?? 0,
      trustItemsCount: dto.trustItems?.length ?? 0,
    });

    return doc;
  }
}
