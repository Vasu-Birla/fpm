import * as path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';




// Manually set FFmpeg path
const ffmpegPath = process.platform === 'win32' ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' : '/usr/bin/ffmpeg';


ffmpeg.setFfmpegPath(ffmpegPath);


// Middleware to Convert Audio to MP3 (Cross-Platform)
const convertToMp3 = async (req, res, next) => {
  if (!req.files || !req.files.audio_profile) return next();

  const audioFile = req.files.audio_profile[0]; // Get uploaded audio
  const inputPath = `public/audio_profiles/${audioFile.filename}`;
  const outputPath = `public/audio_profiles/${Date.now()}.mp3`;

  ffmpeg(inputPath)
    .toFormat('mp3')
    .audioBitrate('128k')
    .on('end', () => {
      fs.unlinkSync(inputPath); // Delete original file
      req.files.audio_profile[0].filename = path.basename(outputPath); // Update filename
      next();
    })
    .on('error', (err) => {
      console.error('FFmpeg Error:', err);
      res.status(500).json({ success: false, message: 'Audio conversion failed' });
    })
    .save(outputPath);
};



const convertToM4A = async (req, res, next) => {
  if (!req.files || !req.files.audio_profile) return next();

  console.log("file from frontend before-> ", req.files )

  try {
    const audioFile = req.files.audio_profile[0]; // Get uploaded audio
    const inputPath = `public/audio_profiles/${audioFile.filename}`;
    const outputPath = `public/audio_profiles/${Date.now()}.m4a`;

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('aac') // Explicitly use AAC codec
        .audioBitrate('128k')
        .outputOptions('-movflags +faststart') // Optimize for streaming
        .on('end', () => {
          console.log('Conversion complete:', outputPath);
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg Error:', err);
          reject(err);
        })
        .save(outputPath);
    });

    // Remove the original file after successful conversion
    fs.unlink(inputPath, (err) => {
      if (err) console.error('Error deleting original file:', err);
    });

    // Update filename in `req.files` to reference the converted file
    req.files.audio_profile[0].filename = path.basename(outputPath);
    req.files.audio_profile[0].path = outputPath;

    next();
  } catch (error) {
    console.error('Audio Conversion Error:', error);
    res.status(500).json({ success: false, message: 'Audio conversion failed' });
  }
};




const convertStoryToM4A = async (req, res, next) => {
  if (!req.files || !req.files.audio_story) return next();

  try {
    const convertedFiles = [];

    for (const audioFile of req.files.audio_story) {
      const inputPath = `public/audio_stories/${audioFile.filename}`;
      const outputPath = `public/audio_stories/${Date.now()}.m4a`;

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('aac') // Use AAC codec for compatibility
          .audioBitrate('128k')
          .outputOptions('-movflags +faststart') // Optimize for streaming
          .on('end', () => {
            console.log('Conversion complete:', outputPath);
            convertedFiles.push({
              originalname: audioFile.originalname,
              filename: path.basename(outputPath),
              path: outputPath,
            });
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg Error:', err);
            reject(err);
          })
          .save(outputPath);
      });

      // Remove the original file after conversion
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Error deleting original file:', err);
      });
    }

    // Replace `req.files.audio_story` with converted files
    req.files.audio_story = convertedFiles;

    next();
  } catch (error) {
    console.error('Audio Conversion Error:', error);
    res.status(500).json({ success: false, message: 'Audio Conversion Failed' });
  }
};


const convertReelToM4A = async (req, res, next) => {
  if (!req.files || !req.files.audio_reel) return next();

  try {
    const convertedFiles = [];

    for (const audioFile of req.files.audio_reel) {
      const inputPath = `public/audio_reels/${audioFile.filename}`;
      const outputPath = `public/audio_reels/${Date.now()}.m4a`;

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('aac') // Use AAC codec for compatibility
          .audioBitrate('128k')
          .outputOptions('-movflags +faststart') // Optimize for streaming
          .on('end', () => {
            console.log('Conversion complete:', outputPath);
            convertedFiles.push({
              originalname: audioFile.originalname,
              filename: path.basename(outputPath),
              path: outputPath,
            });
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg Error:', err);
            reject(err);
          })
          .save(outputPath);
      });

      // Remove the original file after conversion
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Error deleting original file:', err);
      });
    }

    // Replace `req.files.audio_reel` with converted files
    req.files.audio_reel = convertedFiles;

    next();
  } catch (error) {
    console.error('Audio Conversion Error:', error);
    res.status(500).json({ success: false, message: 'Audio Conversion Failed' });
  }
};



const convertCommentToM4A = async (req, res, next) => {
  if (!req.files || !req.files.audio_comment) return next();

  try {
    const convertedFiles = [];

    for (const audioFile of req.files.audio_comment) {
      const inputPath = `public/audio_comments/${audioFile.filename}`;
      const outputPath = `public/audio_comments/${Date.now()}.m4a`;

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('aac') // Use AAC codec for compatibility
          .audioBitrate('128k')
          .outputOptions('-movflags +faststart') // Optimize for streaming
          .on('end', () => {
            console.log('Conversion complete:', outputPath);
            convertedFiles.push({
              originalname: audioFile.originalname,
              filename: path.basename(outputPath),
              path: outputPath,
            });
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg Error:', err);
            reject(err);
          })
          .save(outputPath);
      });

      // Remove the original file after conversion
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Error deleting original file:', err);
      });
    }

    // Replace `req.files.audio_comment` with converted files
    req.files.audio_comment = convertedFiles;

    next();
  } catch (error) {
    console.error('Audio Conversion Error:', error);
    res.status(500).json({ success: false, message: 'Audio Conversion Failed' });
  }
};




// Multer File Filter to Accept Only Images & Audio
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Allow images
  } else if (file.mimetype.startsWith('audio/')) {
    cb(null, true); // Allow audio
  }  else if (file.mimetype.startsWith('video/')) {
    cb(null, true); // Allow video
  }else {
    cb(new Error('Invalid file type. Only images and audio are allowed.'), false);
  }
};



// Define storage for uploaded images
const imageStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("imageUpload API Hited");
    const img = file.originalname;
    const timestamp = Date.now();

    const imageName = `img_${timestamp}${img}`;
    cb(null, imageName);
  }
});

// Create multer instance for image uploads
const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Accept image files
    } else {
      cb(new Error('File type not allowed. Please upload an image.'), false);
    }
  },
});





// common for Image and Audio both Profile --- 
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, 'public/audio_profiles'); // Folder for audio
    } else {
      cb(null, 'public/images/profiles'); // Folder for profile images
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const extname = path.extname(file.originalname);
    const cleanName = file.originalname.replace(/\s+/g, '_'); // Remove spaces

    cb(null, `${timestamp}_${cleanName}`);
  },
});

// Initialize Multer Upload
const profileUpload = multer({ storage: profileStorage });







const vehicleStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/vehicleUploads'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("Vehical data pic uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const extname = path.extname(file.originalname);

    const imageName = `Vehical_${timestamp}${img}`;
    cb(null, imageName);
  }
});






const docStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/docUploads'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("deal media uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const extname = path.extname(file.originalname);
    const imageName = `doc_${timestamp}${extname}`;
    cb(null, imageName);
  }
});



// Define storage for general file uploads
const fileStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    console.log("fileUpload API Hited");
    const timestamp = Date.now();
    const extname = path.extname(file.originalname);
    const fileName = `file_${timestamp}${extname}`;
    cb(null, fileName);
  }
});

// Create multer instance for general file uploads
//const fileUpload = multer({ storage: fileStorage });

const fileUpload = multer({ storage: fileStorage, fileFilter }); // with  file type type validation

//--------- user Post storage folder ------------ 



const thumbnailStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/thumbnail'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("Thumnail  uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const imageName = `thumbnail_${timestamp}${img}`;
    cb(null, imageName);
  }
});



const chatStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/chat_img_vid'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("chat media  uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const imageName = `chat_${timestamp}${img}`;
    cb(null, imageName);
  }
});




const ticketStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/ticket_img'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("ticket_img  uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const imageName = `ticket_${timestamp}${img}`;
    cb(null, imageName);
  }
});


const sliderStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/sliders'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("highlight_  uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const imageName = `slider_${timestamp}${img}`;
    cb(null, imageName);
  }
});


const countryStorage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/images/icons'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    console.log("country img uploaded");
    const img = file.originalname;
    const timestamp = Date.now();
    const imageName = `country_${timestamp}${img}`;
    cb(null, imageName);
  }
});



//------- store with same name as country code for flag
const countryflagStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/icons'); // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    const countryCode = req.body.country_code;
    const ext = file.originalname.split('.').pop(); // Get the file extension (e.g. 'png')
    const imageName = `${countryCode}.${ext}`;
    cb(null, imageName);
  }
});



const docUploads = multer({ storage: docStorage });


const vehicleUploads = multer({ storage: vehicleStorage });


const thumbnailUploads = multer({ storage: thumbnailStorage });


const chatUploads  = multer({ storage: chatStorage });



const ticketUploads  = multer({ storage: ticketStorage });

const sliderUploads  = multer({ storage: sliderStorage });

const countryUploads  = multer({ storage: countryStorage });



export { imageUpload, fileUpload , profileUpload , docUploads ,vehicleUploads  , 
  thumbnailUploads   ,chatUploads,
  ticketUploads , sliderUploads , countryUploads,  
  
   convertToMp3 , convertToM4A , convertStoryToM4A ,convertReelToM4A, convertCommentToM4A};
