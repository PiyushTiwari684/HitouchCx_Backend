import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';



// Get __dirname equivalent for es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// storage configuration for face images 

const faceStorage = multer.diskStorage({
    destination:(req,file,cb)=> {
        const uploadPath = path.join(__dirname, "../../uploads/faces");
        cb(null, uploadPath);
    },

    // How to name the file

    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const randomString = Math.random().toString(36).substring(2, 15);

        // final name - using timestamp and random string for uniqueness
        const filename = `face-${timestamp}-${randomString}${ext}`;
        cb(null, filename);
    },
});

// Storage configuration for audio recordings 

const audioStorage = multer.diskStorage({
    destination: (req,file,cb) => {
        const uploadPath = path.join(__dirname, "../../uploads/audio");
        cb(null, uploadPath);
    },

    // How to name the file

    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const randomString = Math.random().toString(36).substring(2, 15);

        // final name - using timestamp and random string for uniqueness
        const filename = `audio-${timestamp}-${randomString}${extension}`;
        cb(null, filename);
    }


});

// File filters 


// Accept only image files
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"), false);
  }
};

// Accept only audio files
const audioFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/webm", "audio/wav", "audio/ogg"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only MP3, WebM, WAV, and OGG audio files are allowed"), false);
  }
};


// EXPORT MULTER INSTANCES

// For face image uploads (max 5MB)
export const uploadFaceImage = multer({
  storage: faceStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB in bytes
  },
});

// For audio uploads (max 10MB)
export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
  },
});