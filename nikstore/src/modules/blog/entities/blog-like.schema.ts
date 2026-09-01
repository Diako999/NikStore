import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlogLikeDocument = HydratedDocument<BlogLike>;

@Schema({ timestamps: true })
export class BlogLike {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blog: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;
}

export const BlogLikeSchema = SchemaFactory.createForClass(BlogLike);
// One like per user per post
BlogLikeSchema.index({ blog: 1, user: 1 }, { unique: true });
