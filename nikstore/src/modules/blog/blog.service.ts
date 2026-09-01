import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Blog, BlogDocument, BlogStatus } from './entities/blog.schema';
import { BlogLike, BlogLikeDocument } from './entities/blog-like.schema';
import {
  BlogComment,
  BlogCommentDocument,
} from './entities/blog-comment.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogQueryDto } from './dto/blog-query.dto';

function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w؀-ۿ-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 100) || `post-${Date.now()}`
  );
}

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(BlogLike.name) private likeModel: Model<BlogLikeDocument>,
    @InjectModel(BlogComment.name)
    private commentModel: Model<BlogCommentDocument>,
  ) {}

  async findAll(query: BlogQueryDto, adminMode = false) {
    const page = Math.max(1, +(query.page ?? 1));
    const limit = Math.max(1, Math.min(50, +(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (!adminMode) {
      filter.status = BlogStatus.PUBLISHED;
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { excerpt: { $regex: query.search, $options: 'i' } },
        { tags: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.tag) filter.tags = query.tag;

    const sortMap: Record<string, Record<string, SortOrder>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { viewCount: -1 },
    };
    const sort = sortMap[query.sortBy ?? 'newest'] ?? { createdAt: -1 };

    const [posts, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-content')
        .populate('author', 'firstName lastName phone')
        .lean<BlogDocument[]>(),
      this.blogModel.countDocuments(filter),
    ]);

    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<BlogDocument> {
    const post = await this.blogModel
      .findOne({ slug, status: BlogStatus.PUBLISHED })
      .populate('author', 'firstName lastName')
      .lean<BlogDocument>();
    if (!post) throw new NotFoundException('پست یافت نشد');
    await this.blogModel.updateOne(
      { _id: post._id },
      { $inc: { viewCount: 1 } },
    );
    return post;
  }

  async findById(id: string): Promise<BlogDocument> {
    const post = await this.blogModel
      .findById(id)
      .populate('author', 'firstName lastName phone')
      .lean<BlogDocument>();
    if (!post) throw new NotFoundException('پست یافت نشد');
    return post;
  }

  async create(dto: CreateBlogDto, authorId: string): Promise<BlogDocument> {
    const base = dto.slug ? dto.slug : slugify(dto.title);
    const slug = await this.uniqueSlug(base);

    const publishedAt =
      dto.status === BlogStatus.PUBLISHED ? new Date() : undefined;

    return this.blogModel.create({
      ...dto,
      slug,
      author: authorId,
      ...(publishedAt ? { publishedAt } : {}),
    });
  }

  async update(id: string, dto: UpdateBlogDto): Promise<BlogDocument> {
    const existing = await this.blogModel.findById(id);
    if (!existing) throw new NotFoundException('پست یافت نشد');

    const update: Record<string, any> = { ...dto };

    if (dto.slug && dto.slug !== existing.slug) {
      update.slug = await this.uniqueSlug(dto.slug, id);
    } else if (dto.title && !dto.slug) {
      const candidate = slugify(dto.title);
      if (candidate !== existing.slug) {
        update.slug = await this.uniqueSlug(candidate, id);
      }
    }

    if (dto.status === BlogStatus.PUBLISHED && !existing.publishedAt) {
      update.publishedAt = new Date();
    }

    const updated = await this.blogModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean<BlogDocument>();
    if (!updated) throw new NotFoundException('پست یافت نشد');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const post = await this.blogModel.findByIdAndDelete(id);
    if (!post) throw new NotFoundException('پست یافت نشد');
  }

  async getPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
    const result = await this.blogModel.aggregate<{
      tag: string;
      count: number;
    }>([
      { $match: { status: BlogStatus.PUBLISHED } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);
    return result;
  }

  // ── Likes ─────────────────────────────────────────────────────

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ likeCount: number; isLiked: boolean }> {
    const blogOid = new Types.ObjectId(postId);
    const userOid = new Types.ObjectId(userId);

    const existing = await this.likeModel.findOne({
      blog: blogOid,
      user: userOid,
    });

    if (existing) {
      await this.likeModel.deleteOne({ _id: existing._id });
      const updated = await this.blogModel
        .findByIdAndUpdate(postId, { $inc: { likeCount: -1 } }, { new: true })
        .lean<BlogDocument>();
      const likeCount = Math.max(0, updated?.likeCount ?? 0);
      this.logger.log(
        `User ${userId} unliked post ${postId} — count: ${likeCount}`,
      );
      return { likeCount, isLiked: false };
    }

    await this.likeModel.create({ blog: blogOid, user: userOid });
    const updated = await this.blogModel
      .findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { new: true })
      .lean<BlogDocument>();
    const likeCount = updated?.likeCount ?? 1;
    this.logger.log(
      `User ${userId} liked post ${postId} — count: ${likeCount}`,
    );
    return { likeCount, isLiked: true };
  }

  async getLikeStatus(
    postId: string,
    userId: string,
  ): Promise<{ isLiked: boolean; likeCount: number }> {
    const [post, like] = await Promise.all([
      this.blogModel.findById(postId).select('likeCount').lean<BlogDocument>(),
      this.likeModel.exists({
        blog: new Types.ObjectId(postId),
        user: new Types.ObjectId(userId),
      }),
    ]);
    if (!post) throw new NotFoundException('پست یافت نشد');
    return { isLiked: !!like, likeCount: post.likeCount ?? 0 };
  }

  // ── Comments ───────────────────────────────────────────────────

  async addComment(
    postId: string,
    authorId: string,
    content: string,
  ): Promise<BlogCommentDocument> {
    const post = await this.blogModel.exists({
      _id: postId,
      status: BlogStatus.PUBLISHED,
    });
    if (!post) throw new NotFoundException('پست یافت نشد');

    const comment = await this.commentModel.create({
      blog: new Types.ObjectId(postId),
      author: new Types.ObjectId(authorId),
      content: content.trim(),
    });
    this.logger.log(
      `Comment added by user ${authorId} on post ${postId} — pending approval`,
    );
    return comment;
  }

  async getComments(postId: string): Promise<BlogCommentDocument[]> {
    return this.commentModel
      .find({ blog: new Types.ObjectId(postId), isApproved: true })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean<BlogCommentDocument[]>();
  }

  async getPendingComments(): Promise<BlogCommentDocument[]> {
    return this.commentModel
      .find({ isApproved: false })
      .populate('author', 'firstName lastName phone')
      .populate('blog', 'title slug')
      .sort({ createdAt: -1 })
      .lean<BlogCommentDocument[]>();
  }

  async getAllCommentsAdmin(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, +(query.page ?? 1));
    const limit = Math.max(1, Math.min(50, +(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status === 'pending') filter.isApproved = false;
    if (query.status === 'approved') filter.isApproved = true;
    if (query.search) {
      filter.content = { $regex: query.search, $options: 'i' };
    }

    const [items, total, pendingCount] = await Promise.all([
      this.commentModel
        .find(filter)
        .populate('author', 'firstName lastName phone')
        .populate('blog', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<BlogCommentDocument[]>(),
      this.commentModel.countDocuments(filter),
      this.commentModel.countDocuments({ isApproved: false }),
    ]);

    this.logger.debug(
      `getAllCommentsAdmin — page:${page} status:${query.status ?? 'all'} total:${total} pending:${pendingCount}`,
    );
    return {
      items,
      total,
      pendingCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveComment(commentId: string): Promise<BlogCommentDocument> {
    const comment = await this.commentModel
      .findByIdAndUpdate(commentId, { isApproved: true }, { new: true })
      .lean<BlogCommentDocument>();
    if (!comment) throw new NotFoundException('کامنت یافت نشد');
    this.logger.log(`Comment ${commentId} approved`);
    return comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const comment = await this.commentModel.findByIdAndDelete(commentId);
    if (!comment) throw new NotFoundException('کامنت یافت نشد');
    this.logger.log(`Comment ${commentId} deleted`);
  }

  // ── Slug helper ────────────────────────────────────────────────

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let i = 1;
    for (;;) {
      const q: Record<string, any> = { slug };
      if (excludeId) q._id = { $ne: excludeId };
      const exists = await this.blogModel.exists(q);
      if (!exists) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
