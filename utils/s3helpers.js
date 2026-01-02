// utils/s3helpers.js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3c = new S3Client({
  region: process.env.AWS_REGION,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});

export async function uploadBufferToS3({ key, buffer, contentType='application/pdf' }) {
  await s3c.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));
  return key;
}

export async function presignS3Get({ key, expiresIn = 60 * 60 }) {
  const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key });
  return await getSignedUrl(s3c, command, { expiresIn });
}



//---- Delete From s3 bucket 
export async function deleteS3Object({ key }) {
  if (!key) return;
  // Let errors bubble up; controller will decide what to do
  await s3c.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  }));

  
}