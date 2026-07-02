import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../config';

// Ensure the base upload directory exists
const baseUploadDir = path.resolve(process.cwd(), config.UPLOAD_DIR);
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Ensure the avatars directory exists
const avatarsDir = path.join(baseUploadDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Avatar upload configuration
const avatarStorage = multer.diskStorage({
  destination: (req: Request, file: any, cb: any) => {
    cb(null, avatarsDir);
  },
  filename: (req: Request, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || 'unknown';
    cb(null, `${userId}${ext}`);
  },
});

const avatarFileFilter = (
  req: Request,
  file: any,
  cb: any,
) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(
      new ApiError(415, 'Unsupported file type. Only JPEG and PNG are allowed for avatars.') as any,
      false,
    );
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: avatarFileFilter,
});

// Resume upload configuration
const resumesBaseDir = path.join(baseUploadDir, 'resumes');

const resumeStorage = multer.diskStorage({
  destination: (req: Request, file: any, cb: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return cb(new ApiError(401, 'Unauthorized') as any, '');
    }
    const userResumeDir = path.join(resumesBaseDir, userId);

    // Explicitly create intermediate directories before Multer tries to write
    if (!fs.existsSync(userResumeDir)) {
      fs.mkdirSync(userResumeDir, { recursive: true });
    }

    cb(null, userResumeDir);
  },
  filename: (req: Request, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    // Use a random UUID for the filename to avoid collisions
    const crypto = require('crypto');
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}${ext}`);
  },
});

const resumeFileFilter = (
  req: Request,
  file: any,
  cb: any,
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(415, 'Unsupported file type. Only PDF and DOCX are allowed for resumes.') as any,
      false,
    );
  }
};

export const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: resumeFileFilter,
});
