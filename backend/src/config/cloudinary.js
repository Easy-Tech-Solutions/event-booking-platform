import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const hasCloudinaryCredentials = () =>
  Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );

const uploadEventImage = (fileBuffer, mimeType) => {
  if (!hasCloudinaryCredentials()) {
    throw new Error(
      "Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  if (!fileBuffer?.length) {
    throw new Error(`Invalid image buffer for mime type: ${mimeType}`);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "event-booking-platform/events",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
};

// Generic upload for any folder (blog, avatars, etc.)
const uploadImage = (fileBuffer, mimeType, folder = "general") => {
  if (!hasCloudinaryCredentials()) {
    throw new Error("Cloudinary credentials are missing.");
  }
  if (!fileBuffer?.length) {
    throw new Error("Invalid image buffer.");
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `event-booking-platform/${folder}`,
        resource_type: "image",
        unique_filename: true,
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(fileBuffer);
  });
};

export { uploadEventImage, uploadImage, hasCloudinaryCredentials };
