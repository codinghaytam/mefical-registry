import multer from "multer";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";

// Configure storage for initialUpload
const initialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../upload");
    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const initialUpload = multer({
  storage: initialStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  }
});

// Configure storage destination and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../images");
    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// File filter to only allow jpg and png
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only jpg and png files
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Configure multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  }
});

// Method to upload a single image
const uploadSingleImage = upload.single("sondagePhoto");

// Method to upload multiple images

// Method to delete a file
const deleteFile = (filePath: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, "../upload", filePath);
    fs.unlink(fullPath, (err) => {
      if (err) {
        reject(false);
        return;
      }
      resolve(true);
    });
  });
};

// Method to update a file (delete old and upload new)
const updateFile = async (oldFilePath: string, req: Request, res: Response): Promise<string | null> => {
  try {
    // Delete the old file
    await deleteFile(oldFilePath);
    
    // Upload the new file
    return new Promise((resolve, reject) => {
      uploadSingleImage(req, res, (err) => {
        if (err) {
          reject(null);
          return;
        }
        if (!req.file) {
          reject(null);
          return;
        }
        resolve(req.file.filename);
      });
    });
  } catch (error) {
    return null;
  }
};

// Helper to get file extension
const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Helper to check if file is a valid image
const isValidImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
};

// Helper function to delete image if needed
const deleteImageIfExists = async (sondagePhoto: string | null): Promise<void> => {
  if (sondagePhoto) {
    try {
      await deleteFile(sondagePhoto);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }
};

// Helper function to handle uploadSingleImage as a Promise
const uploadImagePromise = (req: Request, res: Response): Promise<string | null> => {
  return new Promise((resolve) => {
    uploadSingleImage(req, res, (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        resolve(null);
        return;
      }
      
      if (!req.file) {
        resolve(null);
        return;
      }
      
      resolve(req.file.filename);
    });
  });
};

export {
  upload,
  uploadSingleImage,
  deleteFile,
  updateFile,
  isValidImageFile,
  getFileExtension,
  deleteImageIfExists,
  uploadImagePromise
};
