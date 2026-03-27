import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type PresignResult = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
};

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not configured`);
  return value;
};

const getAwsRegion = (): string => {
  const region = String(process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '').trim();
  if (!region) {
    throw new Error('AWS region not configured. Set AWS_REGION (or AWS_DEFAULT_REGION) on the backend service.');
  }
  return region;
};

const getAwsCredentialsIfProvided = () => {
  const accessKeyId = String(process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = String(process.env.AWS_SECRET_ACCESS_KEY || '').trim();

  // If either one is missing, let AWS default credential chain handle it.
  if (!accessKeyId || !secretAccessKey) return undefined;

  return {
    accessKeyId,
    secretAccessKey,
  };
};

export const getS3Client = (): S3Client => {
  const region = getAwsRegion();
  const credentials = getAwsCredentialsIfProvided();
  return new S3Client({ region, credentials });
};

const sanitizePathSegment = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  // Keep URL/path-safe characters only.
  return trimmed.replace(/[^a-zA-Z0-9/_-]/g, '_').replace(/\\/g, '/').replace(/\.{2,}/g, '.');
};

const sanitizeFilename = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'upload';
  const base = trimmed.split(/[\\/]/).pop() || trimmed;
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const isAllowedImageContentType = (contentType: string): boolean => {
  const ct = String(contentType || '').toLowerCase();
  return ct === 'image/jpeg' || ct === 'image/png' || ct === 'image/webp' || ct === 'image/heic' || ct === 'image/heif';
};

export const getPublicUrlForKey = (params: { bucket: string; region: string; key: string }): string => {
  const base = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (base && base.trim()) {
    return `${base.replace(/\/$/, '')}/${params.key}`;
  }
  // Works only if the object is publicly readable or served via a public bucket policy.
  return `https://${params.bucket}.s3.${params.region}.amazonaws.com/${params.key}`;
};

export const presignComplaintImageUpload = async (params: {
  filename: string;
  contentType: string;
  uuid?: string;
  folder?: string;
  expiresInSeconds?: number;
}): Promise<PresignResult> => {
  const region = getAwsRegion();
  const bucket = getRequiredEnv('AWS_S3_BUCKET');
  const expiresInSeconds = Math.max(30, Math.min(600, params.expiresInSeconds ?? 60));

  if (!isAllowedImageContentType(params.contentType)) {
    throw new Error('Unsupported contentType. Allowed: image/jpeg, image/png, image/webp, image/heic, image/heif');
  }

  const safeFilename = sanitizeFilename(params.filename);
  const safeUuid = params.uuid ? sanitizePathSegment(params.uuid) : 'anonymous';
  const safeFolder = params.folder ? sanitizePathSegment(params.folder) : 'complaints';

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `${safeFolder}/${safeUuid}/${timestamp}-${cryptoRandomId()}-${safeFilename}`;

  const s3 = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  const publicUrl = getPublicUrlForKey({ bucket, region, key });

  return { key, uploadUrl, publicUrl, expiresInSeconds };
};

const cryptoRandomId = (): string => {
  // Avoid importing node:crypto for older TS configs; use a simple unique-ish id.
  // This is used only in key names, not for security.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};
