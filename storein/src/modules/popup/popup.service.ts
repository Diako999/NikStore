import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Popup, PopupDocument } from './entities/popup.schema';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';

@Injectable()
export class PopupService {
  constructor(
    @InjectModel(Popup.name) private popupModel: Model<PopupDocument>,
  ) {}

  async findActive(): Promise<PopupDocument | null> {
    return this.popupModel
      .findOne({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean<PopupDocument>();
  }

  async findAll(): Promise<PopupDocument[]> {
    return this.popupModel
      .find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean<PopupDocument[]>();
  }

  async findById(id: string): Promise<PopupDocument> {
    const popup = await this.popupModel.findById(id).lean<PopupDocument>();
    if (!popup) throw new NotFoundException('پاپ‌آپ یافت نشد');
    return popup;
  }

  async create(dto: CreatePopupDto): Promise<PopupDocument> {
    const popup = await this.popupModel.create(dto);
    return popup.toObject();
  }

  async update(id: string, dto: UpdatePopupDto): Promise<PopupDocument> {
    const popup = await this.popupModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean<PopupDocument>();
    if (!popup) throw new NotFoundException('پاپ‌آپ یافت نشد');
    return popup;
  }

  async toggleActive(id: string): Promise<PopupDocument> {
    const popup = await this.popupModel.findById(id);
    if (!popup) throw new NotFoundException('پاپ‌آپ یافت نشد');
    popup.isActive = !popup.isActive;
    await popup.save();
    return popup.toObject();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.popupModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('پاپ‌آپ یافت نشد');
  }
}
