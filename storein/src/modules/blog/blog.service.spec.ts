import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BlogService } from './blog.service';
import { Blog, BlogStatus } from './entities/blog.schema';
import { BlogLike } from './entities/blog-like.schema';
import { BlogComment } from './entities/blog-comment.schema';

// ── Plain mock-data shapes ───────────────────────────────────────────────────
interface PostLike {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  status: BlogStatus;
  likeCount: number;
  viewCount: number;
}

interface CommentLike {
  _id: Types.ObjectId | string;
  blog: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  isApproved: boolean;
}

// ── Chainable Mongoose-query mock shapes ────────────────────────────────────
interface LeanOnly<T> {
  lean: jest.Mock<Promise<T>, []>;
}
interface SelectThenLean<T> {
  select: jest.Mock<LeanOnly<T>, [string]>;
}
interface SortThenLean<T> {
  sort: jest.Mock<LeanOnly<T>, [Record<string, number>]>;
}
interface PopulateThenSortThenLean<T> {
  populate: jest.Mock<SortThenLean<T>, unknown[]>;
}
interface CommentAdminChain {
  populate: jest.Mock<CommentAdminChain, unknown[]>;
  sort: jest.Mock<CommentAdminChain, unknown[]>;
  skip: jest.Mock<CommentAdminChain, unknown[]>;
  limit: jest.Mock<CommentAdminChain, unknown[]>;
  lean: jest.Mock<Promise<CommentLike[]>, []>;
}

// ── Mock model interfaces ────────────────────────────────────────────────────
interface MockBlogModel {
  find: jest.Mock<unknown, unknown[]>;
  findOne: jest.Mock<unknown, unknown[]>;
  findById: jest.Mock<SelectThenLean<PostLike | null>, unknown[]>;
  findByIdAndUpdate: jest.Mock<LeanOnly<PostLike | null>, unknown[]>;
  findByIdAndDelete: jest.Mock<unknown, unknown[]>;
  create: jest.Mock<unknown, unknown[]>;
  exists: jest.Mock<Promise<{ _id: Types.ObjectId } | null>, unknown[]>;
  countDocuments: jest.Mock<unknown, unknown[]>;
  aggregate: jest.Mock<unknown, unknown[]>;
  updateOne: jest.Mock<unknown, unknown[]>;
}

interface MockLikeModel {
  findOne: jest.Mock<Promise<{ _id: Types.ObjectId } | null>, unknown[]>;
  create: jest.Mock<Promise<unknown>, unknown[]>;
  deleteOne: jest.Mock<Promise<unknown>, unknown[]>;
  exists: jest.Mock<Promise<{ _id: Types.ObjectId } | null>, unknown[]>;
}

interface MockCommentModel {
  find: jest.Mock<
    PopulateThenSortThenLean<CommentLike[]> | CommentAdminChain,
    unknown[]
  >;
  findById: jest.Mock<unknown, unknown[]>;
  findByIdAndUpdate: jest.Mock<LeanOnly<CommentLike | null>, unknown[]>;
  findByIdAndDelete: jest.Mock<Promise<CommentLike | null>, unknown[]>;
  create: jest.Mock<Promise<CommentLike>, unknown[]>;
  exists: jest.Mock<unknown, unknown[]>;
  countDocuments: jest.Mock<Promise<number>, unknown[]>;
}

const lean = <T>(val: T): LeanOnly<T> => ({
  lean: jest.fn<Promise<T>, []>().mockResolvedValue(val),
});

const mockId = new Types.ObjectId().toString();
const mockUserId = new Types.ObjectId().toString();

const mockPost = (overrides: Partial<PostLike> = {}): PostLike => ({
  _id: new Types.ObjectId(mockId),
  title: 'تست مقاله',
  slug: 'test-post',
  status: BlogStatus.PUBLISHED,
  likeCount: 0,
  viewCount: 0,
  ...overrides,
});

const mockComment = (overrides: Partial<CommentLike> = {}): CommentLike => ({
  _id: new Types.ObjectId(),
  blog: new Types.ObjectId(mockId),
  author: new Types.ObjectId(mockUserId),
  content: 'یک کامنت تستی',
  isApproved: false,
  ...overrides,
});

describe('BlogService', () => {
  let service: BlogService;
  let blogModel: MockBlogModel;
  let likeModel: MockLikeModel;
  let commentModel: MockCommentModel;

  beforeEach(async () => {
    blogModel = {
      find: jest.fn<unknown, unknown[]>(),
      findOne: jest.fn<unknown, unknown[]>(),
      findById: jest.fn<SelectThenLean<PostLike | null>, unknown[]>(),
      findByIdAndUpdate: jest.fn<LeanOnly<PostLike | null>, unknown[]>(),
      findByIdAndDelete: jest.fn<unknown, unknown[]>(),
      create: jest.fn<unknown, unknown[]>(),
      exists: jest.fn<Promise<{ _id: Types.ObjectId } | null>, unknown[]>(),
      countDocuments: jest.fn<unknown, unknown[]>(),
      aggregate: jest.fn<unknown, unknown[]>(),
      updateOne: jest.fn<unknown, unknown[]>(),
    };

    likeModel = {
      findOne: jest.fn<Promise<{ _id: Types.ObjectId } | null>, unknown[]>(),
      create: jest.fn<Promise<unknown>, unknown[]>(),
      deleteOne: jest.fn<Promise<unknown>, unknown[]>(),
      exists: jest.fn<Promise<{ _id: Types.ObjectId } | null>, unknown[]>(),
    };

    commentModel = {
      find: jest.fn<
        PopulateThenSortThenLean<CommentLike[]> | CommentAdminChain,
        unknown[]
      >(),
      findById: jest.fn<unknown, unknown[]>(),
      findByIdAndUpdate: jest.fn<LeanOnly<CommentLike | null>, unknown[]>(),
      findByIdAndDelete: jest.fn<Promise<CommentLike | null>, unknown[]>(),
      create: jest.fn<Promise<CommentLike>, unknown[]>(),
      exists: jest.fn<unknown, unknown[]>(),
      countDocuments: jest.fn<Promise<number>, unknown[]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: getModelToken(Blog.name), useValue: blogModel },
        { provide: getModelToken(BlogLike.name), useValue: likeModel },
        { provide: getModelToken(BlogComment.name), useValue: commentModel },
      ],
    }).compile();

    service = module.get(BlogService);
    jest.clearAllMocks();
  });

  // ── toggleLike ───────────────────────────────────────────────

  describe('toggleLike', () => {
    it('creates a like and increments counter when not yet liked', async () => {
      likeModel.findOne.mockResolvedValue(null);
      likeModel.create.mockResolvedValue({});
      blogModel.findByIdAndUpdate.mockReturnValue(
        lean(mockPost({ likeCount: 1 })),
      );

      const result = await service.toggleLike(mockId, mockUserId);

      expect(likeModel.create).toHaveBeenCalled();
      expect(result).toEqual({ likeCount: 1, isLiked: true });
    });

    it('removes like and decrements counter when already liked', async () => {
      likeModel.findOne.mockResolvedValue({ _id: new Types.ObjectId() });
      likeModel.deleteOne.mockResolvedValue({});
      blogModel.findByIdAndUpdate.mockReturnValue(
        lean(mockPost({ likeCount: 0 })),
      );

      const result = await service.toggleLike(mockId, mockUserId);

      expect(likeModel.deleteOne).toHaveBeenCalled();
      expect(result).toEqual({ likeCount: 0, isLiked: false });
    });

    it('clamps likeCount to 0 if update returns negative', async () => {
      likeModel.findOne.mockResolvedValue({ _id: new Types.ObjectId() });
      likeModel.deleteOne.mockResolvedValue({});
      blogModel.findByIdAndUpdate.mockReturnValue(
        lean(mockPost({ likeCount: -1 })),
      );

      const result = await service.toggleLike(mockId, mockUserId);
      expect(result.likeCount).toBe(0);
    });
  });

  // ── getLikeStatus ────────────────────────────────────────────

  describe('getLikeStatus', () => {
    it('returns isLiked:true when user has liked', async () => {
      blogModel.findById.mockReturnValue({
        select: jest
          .fn<LeanOnly<PostLike | null>, [string]>()
          .mockReturnValue(lean(mockPost({ likeCount: 3 }))),
      });
      likeModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      const result = await service.getLikeStatus(mockId, mockUserId);
      expect(result).toEqual({ isLiked: true, likeCount: 3 });
    });

    it('returns isLiked:false when user has not liked', async () => {
      blogModel.findById.mockReturnValue({
        select: jest
          .fn<LeanOnly<PostLike | null>, [string]>()
          .mockReturnValue(lean(mockPost({ likeCount: 5 }))),
      });
      likeModel.exists.mockResolvedValue(null);

      const result = await service.getLikeStatus(mockId, mockUserId);
      expect(result).toEqual({ isLiked: false, likeCount: 5 });
    });

    it('throws NotFoundException when post not found', async () => {
      blogModel.findById.mockReturnValue({
        select: jest
          .fn<LeanOnly<PostLike | null>, [string]>()
          .mockReturnValue(lean(null)),
      });
      likeModel.exists.mockResolvedValue(null);

      await expect(service.getLikeStatus(mockId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── addComment ───────────────────────────────────────────────

  describe('addComment', () => {
    it('creates comment for published post', async () => {
      blogModel.exists.mockResolvedValue({ _id: new Types.ObjectId(mockId) });
      commentModel.create.mockResolvedValue(mockComment());

      const result = await service.addComment(mockId, mockUserId, 'کامنت تست');

      expect(commentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'کامنت تست' }),
      );
      expect(result.content).toBe('یک کامنت تستی');
    });

    it('trims whitespace from comment content', async () => {
      blogModel.exists.mockResolvedValue({ _id: new Types.ObjectId(mockId) });
      commentModel.create.mockResolvedValue(
        mockComment({ content: 'تمیز شده' }),
      );

      await service.addComment(mockId, mockUserId, '   تمیز شده   ');

      expect(commentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'تمیز شده' }),
      );
    });

    it('throws NotFoundException when post is not published', async () => {
      blogModel.exists.mockResolvedValue(null);

      await expect(
        service.addComment(mockId, mockUserId, 'تست'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getComments ──────────────────────────────────────────────

  describe('getComments', () => {
    it('returns only approved comments sorted by createdAt desc', async () => {
      const approved = [
        mockComment({ isApproved: true, content: 'اول' }),
        mockComment({ isApproved: true, content: 'دوم' }),
      ];
      commentModel.find.mockReturnValue({
        populate: jest
          .fn<SortThenLean<CommentLike[]>, unknown[]>()
          .mockReturnValue({
            sort: jest
              .fn<LeanOnly<CommentLike[]>, [Record<string, number>]>()
              .mockReturnValue(lean(approved)),
          }),
      });

      const result = await service.getComments(mockId);

      expect(commentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isApproved: true }),
      );
      expect(result).toHaveLength(2);
    });
  });

  // ── getAllCommentsAdmin ──────────────────────────────────────

  describe('getAllCommentsAdmin', () => {
    const commentList = [
      mockComment({ isApproved: false }),
      mockComment({ isApproved: true }),
    ];

    function makeChain(data: CommentLike[]): CommentAdminChain {
      const chain: CommentAdminChain = {
        populate: jest.fn<CommentAdminChain, unknown[]>(),
        sort: jest.fn<CommentAdminChain, unknown[]>(),
        skip: jest.fn<CommentAdminChain, unknown[]>(),
        limit: jest.fn<CommentAdminChain, unknown[]>(),
        lean: jest.fn<Promise<CommentLike[]>, []>().mockResolvedValue(data),
      };
      chain.populate.mockReturnValue(chain);
      chain.sort.mockReturnValue(chain);
      chain.skip.mockReturnValue(chain);
      chain.limit.mockReturnValue(chain);
      return chain;
    }

    beforeEach(() => {
      commentModel.find.mockReturnValue(makeChain(commentList));
      commentModel.countDocuments
        .mockResolvedValueOnce(commentList.length) // total
        .mockResolvedValueOnce(1); // pendingCount
    });

    it('returns paginated comments with pendingCount', async () => {
      const result = await service.getAllCommentsAdmin({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pendingCount).toBe(1);
      expect(result.page).toBe(1);
    });

    it('filters by pending status', async () => {
      await service.getAllCommentsAdmin({ status: 'pending' });
      expect(commentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isApproved: false }),
      );
    });

    it('filters by approved status', async () => {
      await service.getAllCommentsAdmin({ status: 'approved' });
      expect(commentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isApproved: true }),
      );
    });

    it('applies content search filter', async () => {
      await service.getAllCommentsAdmin({ search: 'تست' });
      expect(commentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ content: { $regex: 'تست', $options: 'i' } }),
      );
    });

    it('returns no status filter when status is undefined', async () => {
      await service.getAllCommentsAdmin({});
      const callArg = commentModel.find.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('isApproved');
    });
  });

  // ── approveComment ───────────────────────────────────────────

  describe('approveComment', () => {
    it('approves a pending comment', async () => {
      const commentId = new Types.ObjectId().toString();
      commentModel.findByIdAndUpdate.mockReturnValue(
        lean(mockComment({ _id: commentId, isApproved: true })),
      );

      const result = await service.approveComment(commentId);
      expect(result.isApproved).toBe(true);
    });

    it('throws NotFoundException when comment not found', async () => {
      commentModel.findByIdAndUpdate.mockReturnValue(lean(null));
      await expect(service.approveComment('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── deleteComment ────────────────────────────────────────────

  describe('deleteComment', () => {
    it('deletes an existing comment', async () => {
      const commentId = new Types.ObjectId().toString();
      commentModel.findByIdAndDelete.mockResolvedValue(
        mockComment({ _id: commentId }),
      );

      await expect(service.deleteComment(commentId)).resolves.toBeUndefined();
    });

    it('throws NotFoundException when comment not found', async () => {
      commentModel.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.deleteComment('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
