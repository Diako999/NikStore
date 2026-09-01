import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Color, ColorDocument } from './entities/color.schema';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorService {
  constructor(
    @InjectModel(Color.name) private colorModel: Model<ColorDocument>,
  ) {}

  async findAll(): Promise<ColorDocument[]> {
    return this.colorModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean<ColorDocument[]>();
  }

  async adminFindAll(): Promise<ColorDocument[]> {
    return this.colorModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .lean<ColorDocument[]>();
  }

  async create(dto: CreateColorDto): Promise<ColorDocument> {
    const exists = await this.colorModel.findOne({ name: dto.name });
    if (exists) throw new ConflictException('رنگی با این نام قبلاً ثبت شده');
    return this.colorModel.create(dto);
  }

  async update(id: string, dto: UpdateColorDto): Promise<ColorDocument> {
    if (dto.name) {
      const exists = await this.colorModel.findOne({
        name: dto.name,
        _id: { $ne: id },
      });
      if (exists) throw new ConflictException('رنگی با این نام قبلاً ثبت شده');
    }
    const updated = await this.colorModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .lean<ColorDocument>();
    if (!updated) throw new NotFoundException('رنگ یافت نشد');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.colorModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('رنگ یافت نشد');
  }
}
