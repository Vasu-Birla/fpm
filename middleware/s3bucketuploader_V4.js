// middleware/s3bucketuploader_V4.js  (ESM)
import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const fileFilter = (req, file, cb) => {
  const ok = ['image/','audio/','video/','application/pdf']
    .some(t => file.mimetype.startsWith(t));
  cb(ok ? null : new Error('Invalid file type'), ok);
};

const memoryStorage = multer.memoryStorage();
const multerUpload = multer({ storage: memoryStorage, fileFilter });

const uploadToS3 = async (file, folder = 'uploads/', fieldName = 'file') => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const cleanName = `${fieldName}_${Date.now()}_${randomUUID()}${ext}`;
  const key = `${folder}${cleanName}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // no ACL – keep bucket private
  }));

  return { key }; // <<— only return the key
};

const wrapWithS3 = (handler, isProfile = false) => (req, res, next) => {
  handler(req, res, async (err) => {
    if (err) return next(err);
    try {
      const bag = req.files || (req.file ? { [req.file.fieldname]: [req.file] } : {});
      for (const field of Object.keys(bag)) {
        for (const f of bag[field]) {
          const folder = isProfile ? 'images/profiles/' : 'uploads/';
          const { key } = await uploadToS3(f, folder, field);
          // annotate multer file with the S3 key we’ll save to DB
          f.s3Key = key;
        }
      }
      next();
    } catch (e) {
      console.error('S3 upload failed:', e);
      res.status(500).json({ error: 'S3 upload failed' });
    }
  });
};

export const fileUpload = {
  single: (name) => wrapWithS3(multerUpload.single(name), false),
  array: (name, max) => wrapWithS3(multerUpload.array(name, max), false),
  fields: (arr) => wrapWithS3(multerUpload.fields(arr), false),
};

export const profileUpload = {
  single: (name) => wrapWithS3(multerUpload.single(name), true),
  array: (name, max) => wrapWithS3(multerUpload.array(name, max), true),
  fields: (arr) => wrapWithS3(multerUpload.fields(arr), true),
};
