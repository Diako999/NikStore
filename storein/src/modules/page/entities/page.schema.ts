import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PageDocument = HydratedDocument<Page>;

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Schema({ timestamps: true })
export class Page {
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

  @Prop({ required: true, default: '' })
  content: string;

  @Prop({ trim: true, maxlength: 500, default: '' })
  excerpt: string;

  @Prop({
    type: String,
    enum: Object.values(PageStatus),
    default: PageStatus.DRAFT,
    index: true,
  })
  status: PageStatus;

  @Prop({ trim: true, maxlength: 200, default: '' })
  metaTitle: string;

  @Prop({ trim: true, maxlength: 320, default: '' })
  metaDescription: string;

  @Prop({ default: 0 })
  order: number;
}

export const PageSchema = SchemaFactory.createForClass(Page);
PageSchema.index({ status: 1, order: 1 });
