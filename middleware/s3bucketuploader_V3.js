import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

import { storedXSS_validation } from '../utils/storedXSS__upload_guard.js';

// dotenv.config();


const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
console.log('env file at s3 bucket ',envFile )
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// === 1. S3 Client ===
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// === 2. Allowed Types ===
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/', 'audio/', 'video/', 'application/pdf'];
  if (allowedTypes.some(type => file.mimetype.startsWith(type))) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

// === 3. Multer memory storage ===
const memoryStorage = multer.memoryStorage();
const multerUpload = multer({ storage: memoryStorage, fileFilter });

// === 4. S3 Upload Function ===
const uploadToS3 = async (file, folder = 'uploads/', fieldName = 'file') => {
  console.log('==== Starting Uplaod to S3 ====',file );

  const ext = path.extname(file.originalname);
  const cleanName = `${fieldName}_${Date.now()}_${randomUUID()}${ext}`;
  const key = `${folder}${cleanName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read',
  });

  await s3.send(command);

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

// === 5. Core Middleware Wrapper ===

const wrapWithS3 = (handler, isProfile = false) => {
  return async (req, res, next) => {
    // Step 1: Run multer first
    handler(req, res, async (err) => {
      if (err) return next(err);

      try {
        const fileFields = req.files || (req.file ? { [req.file.fieldname]: [req.file] } : {});

        for (const field in fileFields) {
          const files = fileFields[field];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];

                        // === Server-side validation gate ===
            await storedXSS_validation(file);


            const folder = isProfile
              ? 'images/profiles/'
              : 'uploads/';

              //---------- Plain URL disclose Bucket infor in URL 

            const url = await uploadToS3(file, folder, field);
            file.location = url;
            file.url = url;
              //---------- Plain URL disclose Bucket infor in URL 



                //---------- Secure file URL  -----------------

              // const s3Url = await uploadToS3(file, folder, field);
              // //file.original_url = s3Url;  // Internal/admin use only
              // const secureUrl = encodeURIComponent(s3Url);              
              // file.location = secureUrl;
              // file.url = secureUrl;

               //---------- Secure File URL ------------------------




          }
        }

        console.log('✅ S3 upload complete, calling next()');
        next();
         console.log('after');
      } catch (uploadErr) {
        console.error('S3 Upload Error:', uploadErr);
        res.status(500).json({ error: 'S3 upload failed', detail: uploadErr.message });
      }
    });
  };
};





// === 6. Exports Just Like Multer ===
const fileUpload = {
  single: (fieldName) => wrapWithS3(multerUpload.single(fieldName), false),
  array: (fieldName, maxCount) => wrapWithS3(multerUpload.array(fieldName, maxCount), false),
  fields: (fieldsArray) => wrapWithS3(multerUpload.fields(fieldsArray), false),
};

const profileUpload = {
  single: (fieldName) => wrapWithS3(multerUpload.single(fieldName), true),
  array: (fieldName, maxCount) => wrapWithS3(multerUpload.array(fieldName, maxCount), true),
  fields: (fieldsArray) => wrapWithS3(multerUpload.fields(fieldsArray), true),
};

export { fileUpload, profileUpload ,s3  };
