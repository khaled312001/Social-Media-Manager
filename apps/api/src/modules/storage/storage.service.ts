import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('AWS_ENDPOINT');

    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
      ...(endpoint && {
        endpoint,
        forcePathStyle: config.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true',
      }),
    });

    this.bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
    this.cdnUrl = config.get<string>('CDN_URL', '');
  }

  async uploadFile(
    file: Express.Multer.File,
    workspaceId: string,
    folder = 'uploads',
  ): Promise<string> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${workspaceId}/${crypto.randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: { workspaceId, originalName: file.originalname },
      }),
    );

    this.logger.log(`Uploaded file: ${key}`);
    return this.getPublicUrl(key);
  }

  async getPresignedUploadUrl(
    workspaceId: string,
    fileName: string,
    contentType: string,
    folder = 'uploads',
  ) {
    const ext = path.extname(fileName);
    const key = `${folder}/${workspaceId}/${crypto.randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: { workspaceId },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const publicUrl = this.getPublicUrl(key);

    return { uploadUrl, key, publicUrl };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    if (this.cdnUrl) return `${this.cdnUrl}/${key}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
