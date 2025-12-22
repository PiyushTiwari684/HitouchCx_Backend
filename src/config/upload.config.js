import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.config.js";

// ====== 1) PROFILE PHOTOS (agents) ======
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hitouchcx/profilePhotos",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return `agent-${uniqueSuffix}`;
    },
  },
});

const profilePhotoFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
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
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hitouchcx/resumes",
    allowed_formats: ["pdf", "doc", "docx"],
    resource_type: "raw", // Important for non-image files
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
      return `${timestamp}-${originalName}`;
    },
  },
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

// ====== 3) FACE IMAGES (proctoring) ======
const faceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hitouchcx/faces",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `face-${timestamp}-${randomString}`;
    },
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

// ====== 4) AUDIO FILES (proctoring) ======
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hitouchcx/audio",
    resource_type: "video", // Cloudinary stores audio as 'video' resource type
    allowed_formats: ["mp3", "wav", "webm", "ogg", "opus"],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `audio-${timestamp}-${randomString}`;
    },
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
