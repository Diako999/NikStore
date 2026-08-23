import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.schema';
import { Order, OrderDocument, OrderStatus } from '../order/entities/order.schema';
import { Review, ReviewDocument } from '../review/entities/review.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const MAX_ADDRESSES = 10;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)   private userModel:   Model<UserDocument>,
    @InjectModel(Order.name)  private orderModel:  Model<OrderDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  // ── Profile ───────────────────────────────────────────────────
  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select('-__v')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true, runValidators: true })
      .select('-__v')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    this.logger.log(`Profile updated: userId=${userId}`);
    return user;
  }

  // ── Addresses ─────────────────────────────────────────────────
  async addAddress(userId: string, dto: CreateAddressDto): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    if (user.addresses.length >= MAX_ADDRESSES)
      throw new BadRequestException(`حداکثر ${MAX_ADDRESSES} آدرس مجاز است`);

    if (dto.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.isDefault = false));
      dto.isDefault = true;
    }

    user.addresses.push({ ...dto, _id: new Types.ObjectId() } as any);
    await user.save();
    return user.toObject();
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const addr = user.addresses.find((a) => a._id.toString() === addressId);
    if (!addr) throw new NotFoundException('آدرس یافت نشد');

    if (dto.isDefault) user.addresses.forEach((a) => (a.isDefault = false));

    Object.assign(addr, dto);
    await user.save();
    return user.toObject();
  }

  async removeAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const idx = user.addresses.findIndex((a) => a._id.toString() === addressId);
    if (idx === -1) throw new NotFoundException('آدرس یافت نشد');

    const wasDefault = user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);

    if (wasDefault && user.addresses.length > 0)
      user.addresses[0].isDefault = true;

    await user.save();
    return user.toObject();
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const addr = user.addresses.find((a) => a._id.toString() === addressId);
    if (!addr) throw new NotFoundException('آدرس یافت نشد');

    user.addresses.forEach((a) => (a.isDefault = a._id.toString() === addressId));
    await user.save();
    return user.toObject();
  }

  // ── Admin ─────────────────────────────────────────────────────
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    isBlocked?: string,
    role?: string,
  ): Promise<{ items: any[]; total: number }> {
    const skip    = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (search) {
      const re = new RegExp(search, 'i');
      filter['$or'] = [
        { phone: re },
        { firstName: re },
        { lastName: re },
      ];
    }

    if (isBlocked === 'true')  filter['isActive'] = false;
    if (isBlocked === 'false') filter['isActive'] = true;

    if (role) filter['role'] = role;

    const [users, total] = await Promise.all([
      this.userModel.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(limit).lean<UserDocument[]>(),
      this.userModel.countDocuments(filter),
    ]);

    const items = users.map(u => ({ ...u, isBlocked: !u.isActive }));
    return { items, total };
  }

  async findById(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('شناسه کاربر معتبر نیست');

    const oid = new Types.ObjectId(userId);

    const [user, statsResult] = await Promise.all([
      this.userModel.findById(oid).select('-__v').lean<UserDocument>(),
      this.orderModel.aggregate<{ count: number; total: number }>([
        { $match: { userId: oid, status: { $ne: OrderStatus.CANCELLED } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
    ]);

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const stats = statsResult[0] ?? { count: 0, total: 0 };
    return {
      ...user,
      isBlocked:   !user.isActive,
      ordersCount: stats.count,
      totalSpent:  stats.total,
    };
  }

  async getUserReviews(userId: string, page = 1, limit = 10): Promise<any> {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('شناسه کاربر معتبر نیست');

    const oid  = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ userId: oid })
        .select('-__v -adminNote')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name slug thumbnail')
        .lean<ReviewDocument[]>(),
      this.reviewModel.countDocuments({ userId: oid }),
    ]);

    return { items: reviews, total, totalPages: Math.ceil(total / limit) };
  }

  async toggleBlock(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('شناسه کاربر معتبر نیست');
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    user.isActive = !user.isActive;
    await user.save();
    this.logger.log(`User ${userId} isActive → ${user.isActive}`);
    return { ...user.toObject(), isBlocked: !user.isActive };
  }
}
