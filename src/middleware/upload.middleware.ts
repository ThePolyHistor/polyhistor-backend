import fs from "fs";
import multer from "multer";
import path from "path";
import AppError from "../utils/AppError";

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Create the multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed!", 400));
    }
    cb(null, true);
  },
});
