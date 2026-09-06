const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ========================================
// UPLOAD IMAGE
// ========================================

const uploadToCloudinary = (
  buffer,
  folder = "olx-clone"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    streamifier
      .createReadStream(buffer)
      .pipe(uploadStream);
  });
};

// ========================================
// EXTRACT PUBLIC ID FROM URL OR STRING
// ========================================

const extractPublicIdFromUrl = (urlOrPublicId) => {
  if (!urlOrPublicId) return null;

  const target = typeof urlOrPublicId === "object" ? urlOrPublicId.public_id || urlOrPublicId.url : urlOrPublicId;
  if (!target || typeof target !== "string") return null;

  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    return target;
  }

  try {
    const uploadIndex = target.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let path = target.substring(uploadIndex + 8);
    path = path.replace(/^v\d+\//, "");

    const lastDotIndex = path.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      path = path.substring(0, lastDotIndex);
    }

    return path;
  } catch (error) {
    return null;
  }
};

// ========================================
// DELETE IMAGE FROM CLOUDINARY
// ========================================

const deleteFromCloudinary = async (urlOrPublicId) => {
  const publicId = extractPublicIdFromUrl(urlOrPublicId);
  if (!publicId) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
    console.log(`Cloudinary image deleted successfully [public_id: ${publicId}]:`, result);
    return result;
  } catch (error) {
    console.error(`Cloudinary deletion error [public_id: ${publicId}]:`, error.message);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
};
