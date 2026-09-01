import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page, PageDocument, PageStatus } from './entities/page.schema';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 120) || `page-${Date.now()}`
  );
}

@Injectable()
export class PageService {
  constructor(@InjectModel(Page.name) private pageModel: Model<PageDocument>) {}

  async findAll(adminMode = false): Promise<PageDocument[]> {
    const filter = adminMode ? {} : { status: PageStatus.PUBLISHED };
    return this.pageModel
      .find(filter)
      .select('-content')
      .sort({ order: 1, createdAt: -1 })
      .lean<PageDocument[]>();
  }

  async findBySlug(slug: string): Promise<PageDocument> {
    const page = await this.pageModel
      .findOne({ slug, status: PageStatus.PUBLISHED })
      .lean<PageDocument>();
    if (!page) throw new NotFoundException('صفحه یافت نشد');
    return page;
  }

  async findById(id: string): Promise<PageDocument> {
    const page = await this.pageModel.findById(id).lean<PageDocument>();
    if (!page) throw new NotFoundException('صفحه یافت نشد');
    return page;
  }

  async create(dto: CreatePageDto): Promise<PageDocument> {
    const slug = dto.slug || slugify(dto.title);
    const exists = await this.pageModel.exists({ slug });
    if (exists) throw new ConflictException('این slug قبلاً استفاده شده است');
    return this.pageModel.create({
      ...dto,
      slug,
      status: (dto.status ?? 'draft') as PageStatus,
    });
  }

  async update(id: string, dto: UpdatePageDto): Promise<PageDocument> {
    const existing = await this.pageModel.findById(id);
    if (!existing) throw new NotFoundException('صفحه یافت نشد');

    const update: Record<string, any> = { ...dto };

    if (dto.slug && dto.slug !== existing.slug) {
      const conflict = await this.pageModel.exists({
        slug: dto.slug,
        _id: { $ne: id },
      });
      if (conflict)
        throw new ConflictException('این slug قبلاً استفاده شده است');
    }

    const updated = await this.pageModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean<PageDocument>();
    if (!updated) throw new NotFoundException('صفحه یافت نشد');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const page = await this.pageModel.findByIdAndDelete(id);
    if (!page) throw new NotFoundException('صفحه یافت نشد');
  }
}
