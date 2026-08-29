import * as fs from 'fs';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';

jest.mock('fs');

const mockConfig = (
  dest = '/tmp/uploads',
  baseUrl = 'http://localhost:3000',
) => ({
  get: jest.fn((key: string) => {
    if (key === 'upload.dest') return dest;
    if (key === 'upload.baseUrl') return baseUrl;
    return undefined;
  }),
});

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

    const mod = await Test.createTestingModule({
      providers: [
        LocalStorageProvider,
        { provide: ConfigService, useValue: mockConfig() },
      ],
    }).compile();

    provider = mod.get(LocalStorageProvider);
  });

  // ── getUrl ─────────────────────────────────────────────────────
  describe('getUrl()', () => {
    it('returns a root-relative path — no protocol or hostname', () => {
      const url = provider.getUrl('products/abc.webp');
      expect(url).toBe('/uploads/products/abc.webp');
    });

    it('does NOT contain http:// or https://', () => {
      const url = provider.getUrl('banners/hero.webp');
      expect(url).not.toMatch(/^https?:\/\//);
    });

    it('starts with /uploads/', () => {
      const url = provider.getUrl('avatars/user.webp');
      expect(url.startsWith('/uploads/')).toBe(true);
    });

    it('preserves the full key after /uploads/', () => {
      const key = 'reviews/uuid-1234_thumb.webp';
      expect(provider.getUrl(key)).toBe(`/uploads/${key}`);
    });
  });

  // ── save ───────────────────────────────────────────────────────
  describe('save()', () => {
    it('writes file to dest/folder/filename', async () => {
      const buf = Buffer.from('img');
      await provider.save(
        {
          buffer: buf,
          mimeType: 'image/webp',
          size: buf.length,
          filename: 'x.webp',
        },
        'products',
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('products'),
        buf,
      );
    });

    it('returns StorageResult with relative url', async () => {
      const buf = Buffer.from('img');
      const result = await provider.save(
        {
          buffer: buf,
          mimeType: 'image/webp',
          size: buf.length,
          filename: 'x.webp',
        },
        'products',
      );
      expect(result.url).toBe('/uploads/products/x.webp');
      expect(result.key).toBe('products/x.webp');
    });

    it('creates directory when it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
      await provider.save(
        {
          buffer: Buffer.from('x'),
          mimeType: 'image/webp',
          size: 1,
          filename: 'y.webp',
        },
        'categories',
      );
      expect(mkdirSpy).toHaveBeenCalledWith(
        expect.stringContaining('categories'),
        { recursive: true },
      );
      mkdirSpy.mockRestore();
    });
  });

  // ── delete ─────────────────────────────────────────────────────
  describe('delete()', () => {
    it('deletes the file when it exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockReturnValue(undefined);
      await provider.delete('products/x.webp');
      expect(unlinkSpy).toHaveBeenCalledWith(
        expect.stringContaining(path.join('products', 'x.webp')),
      );
      unlinkSpy.mockRestore();
    });

    it('does nothing when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockReturnValue(undefined);
      await provider.delete('products/missing.webp');
      expect(unlinkSpy).not.toHaveBeenCalled();
      unlinkSpy.mockRestore();
    });
  });
});
