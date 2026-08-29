import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  dest: process.env.UPLOAD_DEST || './uploads',
  maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '5242880', 10),
  baseUrl: process.env.UPLOAD_BASE_URL || 'http://localhost:3000',
}));
