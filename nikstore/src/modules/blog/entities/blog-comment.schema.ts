import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlogCommentDocument = HydratedDocument<BlogComment>;

@Schema({ timestamps: true })
export class BlogComment {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blog: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  content: string;

  @Prop({ default: false, index: true })
  isApproved: boolean;
}

export const BlogCommentSchema = SchemaFactory.createForClass(BlogComment);
BlogCommentSchema.index({ blog: 1, isApproved: 1, createdAt: -1 });
