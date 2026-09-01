import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './entities/blog.schema';
import { BlogLike, BlogLikeSchema } from './entities/blog-like.schema';
import { BlogComment, BlogCommentSchema } from './entities/blog-comment.schema';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: BlogLike.name, schema: BlogLikeSchema },
      { name: BlogComment.name, schema: BlogCommentSchema },
    ]),
  ],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService, MongooseModule],
})
export class BlogModule {}
