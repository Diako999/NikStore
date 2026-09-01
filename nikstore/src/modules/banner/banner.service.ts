import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './entities/banner.schema';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const ACTIVE_SORT = { sortOrder: 1, createdAt: 1 } as const;

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(BannerService.name);
  }

  /** Public — hero slider only */
  async findActive(): Promise<BannerDocument[]> {
    return this.bannerModel
      .find({ isActive: true, type: 'hero' })
      .sort(ACTIVE_SORT)
      .select('-__v')
      .lean<BannerDocument[]>();
  }

  /** Public — two-column promo cards only */
  async findActivePromo(): Promise<BannerDocument[]> {
    return this.bannerModel
      .find({ isActive: true, type: 'promo' })
      .sort(ACTIVE_SORT)
      .select('-__v')
      .lean<BannerDocument[]>();
  }

  /** Admin — all banners regardless of type / isActive */
  async findAll(): Promise<BannerDocument[]> {
    return this.bannerModel
      .find()
      .sort(ACTIVE_SORT)
      .select('-__v')
      .lean<BannerDocument[]>();
  }

  async create(dto: CreateBannerDto): Promise<BannerDocument> {
    const type = dto.type ?? 'hero';
    const count = await this.bannerModel.countDocuments({ type });
    const sortOrder = dto.sortOrder ?? count;
    const banner = await this.bannerModel.create({
      mobileImageUrl: '',
      ...dto,
      type,
      sortOrder,
    });
    this.logger.log('Banner created', {
      bannerId: String(banner._id),
      title: banner.title,
      type,
      sortOrder,
    });
    return banner;
  }

  async update(id: string, dto: UpdateBannerDto): Promise<BannerDocument> {
    const banner = await this.bannerModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .select('-__v')
      .lean<BannerDocument>();
    if (!banner) throw new NotFoundException('بنر یافت نشد');
    this.logger.log('Banner updated', {
      bannerId: id,
      type: banner.type,
      fields: Object.keys(dto),
    });
    return banner;
  }

  async remove(id: string): Promise<void> {
    const banner = await this.bannerModel.findByIdAndDelete(id);
    if (!banner) throw new NotFoundException('بنر یافت نشد');
    this.logger.log('Banner deleted', {
      bannerId: id,
      title: banner.title,
      type: banner.type,
    });
  }

  async reorder(dto: ReorderBannersDto): Promise<void> {
    const ops = dto.ids.map((bid, idx) => ({
      updateOne: {
        filter: { _id: bid },
        update: { $set: { sortOrder: idx } },
      },
    }));
    await this.bannerModel.bulkWrite(ops);
    this.logger.log('Banners reordered', { count: dto.ids.length });
  }

  async toggleActive(id: string): Promise<BannerDocument> {
    const banner = await this.bannerModel.findById(id);
    if (!banner) throw new NotFoundException('بنر یافت نشد');
    banner.isActive = !banner.isActive;
    await banner.save();
    this.logger.log('Banner toggled', {
      bannerId: id,
      isActive: banner.isActive,
      type: banner.type,
    });
    return banner.toObject();
  }
}
