import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Brand, BrandDocument } from './entities/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  async create(dto: CreateBrandDto): Promise<BrandDocument> {
    const slug = await this.generateSlug(dto.slug || dto.name);
    return this.brandModel.create({ ...dto, slug });
  }

  async findAll(): Promise<BrandDocument[]> {
    return this.brandModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .lean<BrandDocument[]>();
  }

  async findActive(): Promise<BrandDocument[]> {
    return this.brandModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean<BrandDocument[]>();
  }

  async findById(id: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findById(id).lean<BrandDocument>();
    if (!brand) throw new NotFoundException('برند یافت نشد');
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto): Promise<BrandDocument> {
    if (dto.name && !dto.slug) {
      const existing = await this.brandModel.findById(id).lean<BrandDocument>();
      if (existing && existing.name !== dto.name) {
        dto.slug = await this.generateSlug(dto.name, id);
      }
    }
    const brand = await this.brandModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean<BrandDocument>();
    if (!brand) throw new NotFoundException('برند یافت نشد');
    return brand;
  }

  async remove(id: string): Promise<void> {
    const brand = await this.brandModel.findByIdAndDelete(id);
    if (!brand) throw new NotFoundException('برند یافت نشد');
  }

  private async generateSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base =
      slugify(name, { lower: true, strict: true, locale: 'fa' }) ||
      name.replace(/\s+/g, '-');
    let slug = base;
    let i = 1;
    while (true) {
      const query: Record<string, any> = { slug };
      if (excludeId) query._id = { $ne: excludeId };
      const exists = await this.brandModel.exists(query);
      if (!exists) break;
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
