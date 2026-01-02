// ------- upload.js------------

import * as path from 'path';
import multer from 'multer';


// Define storage for uploaded images
const storage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/userprofile'); 
  },
  filename: function (req, file, cb) { console.log("user profile api Hited")

    
    const img = file.originalname;
    const timestamp = Date.now();
    const extname = path.extname(file.originalname);
  
    const imageName = `usrprofile_${timestamp}${img}`;
    cb(null, imageName);
  }
});

// Create multer instance with configured storage
const upload = multer({ storage });

export default upload;




