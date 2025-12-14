import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ====== __dirname for ES modules ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ====== 1) PROFILE PHOTOS (agents) ======
const profilePhotosDir = path.join(process.cwd(), "uploads", "profilePhotos");
ensureDir(profilePhotosDir);

const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "agent-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const profilePhotoFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: profilePhotoFileFilter,
});

// ====== 2) RESUMES (PDF / DOC / DOCX) ======
const resumesDir = path.join(process.cwd(), "uploads", "resumes");
ensureDir(resumesDir);

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumesDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const resumeFileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and Word documents (.pdf, .doc, .docx) are allowed"));
  }
};

export const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: resumeFileFilter,
});

// ====== 3) FACE IMAGES & AUDIO (proctoring) ======
const facesDir = path.join(process.cwd(), "uploads", "faces");
const audioDir = path.join(process.cwd(), "uploads", "audio");
ensureDir(facesDir);
ensureDir(audioDir);

// Face images
const faceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, facesDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `face-${timestamp}-${randomString}${ext}`;
    cb(null, filename);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"), false);
  }
};

export const uploadFaceImage = multer({
  storage: faceStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Audio
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);

    // Get extension from originalname
    let extension = path.extname(file.originalname);

    // If no extension found, determine from MIME type (CRITICAL FIX!)
    if (!extension || extension === "") {
      console.log(
        `⚠️  No extension in originalname: "${file.originalname}", using MIME type: ${file.mimetype}`,
      );
      const mimeToExt = {
        "audio/webm": ".webm",
        "audio/webm;codecs=opus": ".webm",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/opus": ".opus",
      };
      extension = mimeToExt[file.mimetype] || ".webm"; // Default to .webm
      console.log(`   ✅ Using extension: ${extension}`);
    }

    const filename = `audio-${timestamp}-${randomString}${extension}`;
    console.log(`[Multer] Saving audio as: ${filename}`);
    cb(null, filename);
  },
});

const audioFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/webm", "audio/wav", "audio/ogg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP3, WebM, WAV, and OGG audio files are allowed"), false);
  }
};

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
