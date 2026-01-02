// middleware/s3bucketuploader.js  (ESM)
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
  const starts = ['image/', 'audio/', 'video/'];
  const exact  = [
  'application/pdf',
  'application/vnd.ms-excel',                                           // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
  'application/msword',                                                 // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

  const ok =
    starts.some(t => file.mimetype.startsWith(t)) ||
    exact.includes(file.mimetype);

  cb(ok ? null : new Error('Invalid file type'), ok);
};


const memoryStorage = multer.memoryStorage();
const multerUpload = multer({ storage: memoryStorage, fileFilter });

/* ===========================
   Helpers for safe naming
   =========================== */
// ===>> New
function safeFileBase(name='') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')   // keep only [a-z0-9._-]
// ===>> New
    .replace(/-+/g, '-')              // collapse multiple dashes
// ===>> New
    .replace(/^\.+/, '')              // no leading dots
// ===>> New
    .slice(0, 120);                   // keep it reasonable
}


function extFromMimetype(m) {
  if (!m) return '';
  if (m === 'image/jpeg' || m === 'image/jpg') return '.jpg';
  if (m === 'image/png')  return '.png';
  if (m === 'image/gif')  return '.gif';
  if (m === 'image/webp') return '.webp';
  if (m === 'application/pdf') return '.pdf';
  if (m === 'application/vnd.ms-excel') return '.xls';
  if (m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return '.xlsx';
  if (m === 'application/msword') return '.doc';
  if (m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
  return '';
}


// ===>> New: added overrideKey param
const uploadToS3 = async (file, folder = 'uploads/', fieldName = 'file', overrideKey = null) => {
// ===>> New
  const origExt = path.extname(file.originalname || '').toLowerCase();
// ===>> New
  const mimeExt = extFromMimetype(file.mimetype) || origExt || '.bin';

  let key;
// ===>> New: if override provided, use sanitized base + forced mime ext
  if (overrideKey) {
    const base = safeFileBase(path.basename(overrideKey, path.extname(overrideKey)));
    key = `${folder}${base}${mimeExt}`;
  } else {
    key = `${folder}${fieldName}_${Date.now()}_${randomUUID()}${mimeExt}`;
  }

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // no ACL – keep bucket private
  }));

  return { key }; // <<— only return the key
};

// ===>> New: read folder/key overrides from body and normalize folder
const wrapWithS3 = (handler, isProfile = false) => (req, res, next) => {
  handler(req, res, async (err) => {
    if (err) return next(err);
    try {
      const rawFiles = req.files || (req.file ? [req.file] : []);
      const bag = Array.isArray(rawFiles)
        ? { [rawFiles[0]?.fieldname || 'files']: rawFiles }
        : rawFiles;

      for (const field of Object.keys(bag)) {
        const files = Array.isArray(bag[field]) ? bag[field] : [bag[field]];
        for (const f of files) {
// ===>> New: folder override support (folder_<field> | <field>_folder)
          let folder =
            req.body?.[`folder_${field}`] ||
            req.body?.[`${field}_folder`] ||
            (isProfile ? 'images/profiles/' : 'uploads/');

// ===>> New: normalize folder to ensure trailing slash and no leading slash
          folder = String(folder || 'uploads/')
            .replace(/^\/*/, '')
            .replace(/\/*$/, '') + '/';

// ===>> New: filename override support (key_<field> | <field>_keyname)
          const overrideFromBody =
            req.body?.[`key_${field}`] ||
            req.body?.[`${field}_keyname`] ||
            null;

// ===>> New: pass override to uploadToS3
          const { key } = await uploadToS3(f, folder, field, overrideFromBody);

// existing annotation, unchanged
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

    // ✅ For routes with multipart/form-data but NO files
  none: () => multerUpload.none(),
};

export const profileUpload = {
  single: (name) => wrapWithS3(multerUpload.single(name), true),
  array: (name, max) => wrapWithS3(multerUpload.array(name, max), true),
  fields: (arr) => wrapWithS3(multerUpload.fields(arr), true),

    
    // ✅ For routes with multipart/form-data but NO files
  none: () => multerUpload.none(),
};
