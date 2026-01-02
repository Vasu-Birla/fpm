import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Ensure .env is loaded

// Setup S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// File filter (same as before)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/',
    'audio/',
    'video/',
    'application/pdf',
  ];

  if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, audio, video, and PDF files are allowed.'), false);
  }
};

// -----------------------------
// S3 STORAGE FOR ALL FILES
// -----------------------------
const fileUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const timestamp = Date.now();
      const extname = path.extname(file.originalname);
      const cleanName = file.originalname.replace(/\s+/g, '_');
      const folder = file.fieldname === 'image' || file.mimetype.startsWith('image/')
        ? 'images/profiles/'
        : file.mimetype.startsWith('audio/')
        ? 'audio_profiles/'
        : 'uploads/';
      const finalName = `${folder}${timestamp}_${cleanName}`;
      cb(null, finalName);
    },
  }),
  fileFilter,
});

const profileUpload = fileUpload; // You can keep separate configs if needed

export { fileUpload, profileUpload };
