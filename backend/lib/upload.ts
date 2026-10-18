import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// Allow-list of types. The extension is chosen here, never taken from the
// uploaded filename.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function saveUploadedImage(file: File): Promise<string> {
  // file.type comes from the browser and can be faked, so this is only a
  // first filter. Cloudinary also rejects anything that isn't a real image.
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("INVALID_IMAGE_TYPE");
  if (file.size > MAX_BYTES) throw new Error("IMAGE_TOO_LARGE");

  const buffer = Buffer.from(await file.arrayBuffer());

  if (cloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "materialsco/products",
            resource_type: "image",
            allowed_formats: ["jpg", "png", "webp", "gif"],
          },
          (error, res) =>
            error || !res ? reject(error ?? new Error("UPLOAD_FAILED")) : resolve(res)
        )
        .end(buffer);
    });

    return result.secure_url;
  }

  // Production has no persistent disk, so writing locally there would lose files.
  if (process.env.NODE_ENV === "production") throw new Error("STORAGE_NOT_CONFIGURED");

  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(process.cwd(), "public", "uploads", "products", filename);
  await writeFile(filepath, buffer);
  return `/uploads/products/${filename}`;
}