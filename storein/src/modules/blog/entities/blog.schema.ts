import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop({ trim: true, maxlength: 500, default: '' })
  excerpt: string;

  @Prop({ default: '' })
  featuredImage: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  author: Types.ObjectId;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({
    type: String,
    enum: Object.values(BlogStatus),
    default: BlogStatus.DRAFT,
    index: true,
  })
  status: BlogStatus;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ type: Date, index: true })
  publishedAt: Date;

  @Prop({ trim: true, maxlength: 70 })
  metaTitle?: string;

  @Prop({ trim: true, maxlength: 160 })
  metaDescription?: string;

  @Prop({ type: [{ question: String, answer: String }], default: [] })
  faq: { question: string; answer: string }[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
