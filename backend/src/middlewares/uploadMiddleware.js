import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 25, // 25MB
  },
});

export const uploadImageFromBuffer = async (buffer, options = {}, filenameHint = "file") => {
  try {
    const ext = path.extname(filenameHint).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext);

    // Thử upload lên Cloudinary trước
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const cloudinaryOptions = {
        folder: "moji_chat/uploads",
        resource_type: "auto",
        ...options,
      };

      if (isImage) {
        cloudinaryOptions.transformation = [{ width: 1200, crop: "limit" }];
        cloudinaryOptions.eager = [{ width: 400, crop: "limit", format: "jpg" }];
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          cloudinaryOptions,
          (error, res) => {
            if (error) reject(error);
            else resolve(res);
          }
        );
        uploadStream.end(buffer);
      });

      const thumbnailUrl = result.eager && result.eager.length > 0 ? result.eager[0].secure_url : result.secure_url;
      return { ...result, thumbnailUrl };
    }
  } catch (error) {
    console.warn("⚠️ Cloudinary upload không thành công, chuyển sang lưu tệp cục bộ:", error.message);
  }

  // Fallback: Lưu file trực tiếp vào thư mục /uploads local
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(filenameHint) || ".bin";
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  fs.writeFileSync(filePath, buffer);

  const serverUrl = (process.env.SERVER_URL || process.env.CLIENT_URL || "").replace(/\/$/, "");
  const fileUrl = serverUrl ? `${serverUrl}/api/uploads/${uniqueName}` : `/api/uploads/${uniqueName}`;

  return {
    secure_url: fileUrl,
    url: fileUrl,
    public_id: uniqueName,
    bytes: buffer.length,
  };
};
