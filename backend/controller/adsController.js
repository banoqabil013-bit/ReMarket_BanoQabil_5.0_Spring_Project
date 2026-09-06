const Ad = require("../models/Ads.js");
const User = require("../models/Users.js");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload.js");
const cloudinary = require("../config/cloudinary.js");
const { sendEmail } = require("../utils/sendEmail.js");
const {
  generateAdActionToken,
  verifyAdActionToken,
} = require("../utils/adActionToken.js");

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "banoqabil013@gmail.com"
).toLowerCase();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const sendAdReviewEmail = async (ad, user) => {
  const approveToken = generateAdActionToken(ad._id, "approve");
  const rejectToken = generateAdActionToken(ad._id, "reject");

  const approveUrl = `${BACKEND_URL}/ads/email-action?token=${approveToken}`;
  const rejectUrl = `${BACKEND_URL}/ads/email-action?token=${rejectToken}`;
  const adminPanelUrl = `${FRONTEND_URL}/admin/ads`;

  // Fetch all admins from DB to ensure every admin receives the review email
  const adminUsers = await User.find({ role: "admin" }).select("email");
  const adminEmails = new Set(adminUsers.map((u) => u.email.toLowerCase()));
  adminEmails.add(ADMIN_EMAIL);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #7c3aed; margin-top: 0;">New Ad Pending Approval</h2>
      <p style="color: #475569; font-size: 16px;">A user has posted a new ad that requires your review and approval before it goes live.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a;">${ad.title}</h3>
        <p style="margin: 6px 0;"><strong>Price:</strong> <span style="color: #7c3aed; font-weight: bold;">Rs. ${Number(ad.price).toLocaleString()}</span></p>
        <p style="margin: 6px 0;"><strong>Category:</strong> ${ad.category?.name || "N/A"}</p>
        <p style="margin: 6px 0;"><strong>City:</strong> ${ad.city}</p>
        <p style="margin: 6px 0;"><strong>Condition:</strong> ${ad.condition}</p>
        <p style="margin: 6px 0;"><strong>Posted by:</strong> ${user.name} (${user.email})</p>
        <p style="margin: 12px 0 0 0;"><strong>Description:</strong><br/>${ad.description}</p>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${approveUrl}" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 12px;">✓ Approve Ad</a>
        <a href="${rejectUrl}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">✕ Reject Ad</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 14px; text-align: center;">You can also review all pending ads directly in the <a href="${adminPanelUrl}" style="color: #7c3aed; font-weight: bold;">Admin Panel</a>.</p>
    </div>
  `;

  for (const email of adminEmails) {
    try {
      await sendEmail({
        to: email,
        subject: `[Pending Approval] New Ad Posted: ${ad.title}`,
        html,
      });
    } catch (err) {
      console.error(`Failed to send ad review email to admin ${email}:`, err.message);
    }
  }
};

const sendAdStatusEmailToUser = async (ad, user, status) => {
  const isApproved = status === "active";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isApproved ? "#16a34a" : "#dc2626"};">
        Your Ad Has Been ${isApproved ? "Approved" : "Rejected"}
      </h2>
      <p>Hello ${user.name},</p>
      <p>
        Your ad <strong>"${ad.title}"</strong> has been
        <strong>${isApproved ? "approved and is now live" : "rejected"}</strong>.
      </p>
      ${
        isApproved
          ? `<p><a href="${FRONTEND_URL}/ads/${ad._id}">View your ad</a></p>`
          : "<p>Please review the ad details and submit again if needed.</p>"
      }
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Ad ${isApproved ? "Approved" : "Rejected"}: ${ad.title}`,
    html,
  });
};

// ========================================
// CREATE AD
// ========================================

const createAd = async (req, res) => {
  try {
    const { title, description, category, price, condition, city } = req.body;

    if (!title || !description || !category || !price || !condition || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required",
      });
    }

    const images = [];

    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: "Maximum 5 images allowed",
        });
      }

      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "olx-clone/ads");

        images.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    const ad = await Ad.create({
      user: req.user._id,
      title: title.trim(),
      description,
      category,
      price,
      condition,
      images,
      city: city.trim(),
      status: "pending",
    });

    const populatedAd = await Ad.findById(ad._id)
      .populate("user", "name email")
      .populate("category", "name");

    try {
      await sendAdReviewEmail(populatedAd, req.user);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Ad submitted for admin approval",
      ad: populatedAd,
    });
  } catch (error) {
    console.error("Create Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ad",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL ADS (PUBLIC - APPROVED ONLY)
// ========================================

const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find({ status: "active" })
      .populate("user", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ads.length,
      ads,
    });
  } catch (error) {
    console.error("Get Ads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ads",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE AD
// ========================================

const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate("user", "name email")
      .populate("category", "name");

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    if (ad.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    return res.status(200).json({
      success: true,
      ad,
    });
  } catch (error) {
    console.error("Get Single Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ad",
      error: error.message,
    });
  }
};

// ========================================
// GET MY ADS
// ========================================

const getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ user: req.user._id })
      .populate("user", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ads.length,
      ads,
    });
  } catch (error) {
    console.error("Get My Ads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your ads",
      error: error.message,
    });
  }
};

// ========================================
// GET PENDING ADS (ADMIN)
// ========================================

const getPendingAds = async (req, res) => {
  try {
    const ads = await Ad.find({ status: "pending" })
      .populate("user", "name email phone city")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ads.length,
      ads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending ads",
      error: error.message,
    });
  }
};

// ========================================
// APPROVE AD (ADMIN)
// ========================================

const approveAd = async (adId) => {
  const ad = await Ad.findById(adId).populate("user", "name email");

  if (!ad) {
    throw new Error("Ad not found");
  }

  if (ad.status !== "pending") {
    throw new Error("Only pending ads can be approved");
  }

  ad.status = "active";
  await ad.save();

  try {
    await sendAdStatusEmailToUser(ad, ad.user, "active");
  } catch (emailError) {
    console.error("Failed to send approval email to user:", emailError.message);
  }

  return ad;
};

const approveAdHandler = async (req, res) => {
  try {
    const ad = await approveAd(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Ad approved successfully",
      ad,
    });
  } catch (error) {
    const statusCode = error.message === "Ad not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// REJECT AD (ADMIN)
// ========================================

const rejectAd = async (adId) => {
  const ad = await Ad.findById(adId).populate("user", "name email");

  if (!ad) {
    throw new Error("Ad not found");
  }

  if (ad.status !== "pending") {
    throw new Error("Only pending ads can be rejected");
  }

  ad.status = "rejected";
  await ad.save();

  try {
    await sendAdStatusEmailToUser(ad, ad.user, "rejected");
  } catch (emailError) {
    console.error("Failed to send rejection email to user:", emailError.message);
  }

  return ad;
};

const rejectAdHandler = async (req, res) => {
  try {
    const ad = await rejectAd(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Ad rejected successfully",
      ad,
    });
  } catch (error) {
    const statusCode = error.message === "Ad not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// EMAIL ACTION (FROM EMAIL LINKS)
// ========================================

const handleEmailAction = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Invalid action link.");
    }

    const decoded = verifyAdActionToken(token);
    const ad =
      decoded.action === "approve"
        ? await approveAd(decoded.adId)
        : await rejectAd(decoded.adId);

    const message =
      decoded.action === "approve"
        ? `Ad "${ad.title}" has been approved and is now live.`
        : `Ad "${ad.title}" has been rejected.`;

    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
          <h2 style="color: ${decoded.action === "approve" ? "#16a34a" : "#dc2626"};">
            ${decoded.action === "approve" ? "Ad Approved" : "Ad Rejected"}
          </h2>
          <p>${message}</p>
          <a href="${FRONTEND_URL}/admin/ads">Go to Admin Panel</a>
        </body>
      </html>
    `);
  } catch (error) {
    return res.status(400).send("Invalid or expired action link.");
  }
};

// ========================================
// UPDATE AD
// ========================================

const updateAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    const isOwner = ad.user.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this ad",
      });
    }

    const { title, description, category, price, condition, city } = req.body;

    if (title !== undefined) {
      ad.title = title.trim();
    }

    if (description !== undefined) {
      ad.description = description;
    }

    if (category !== undefined) {
      ad.category = category;
    }

    if (price !== undefined) {
      ad.price = price;
    }

    if (condition !== undefined) {
      ad.condition = condition;
    }

    if (city !== undefined) {
      ad.city = city.trim();
    }

    if (isOwner && !isAdminUser) {
      ad.status = "pending";
    } else if (req.body.status !== undefined && isAdminUser) {
      ad.status = req.body.status;
    }

    let removedImages = req.body.removedImages || [];

    if (!Array.isArray(removedImages)) {
      removedImages = [removedImages];
    }

    removedImages = removedImages.filter(Boolean);

    const imagesToRemove = ad.images.filter((image) =>
      removedImages.includes(image.public_id),
    );

    if (imagesToRemove.length > 0) {
      ad.images = ad.images.filter(
        (image) => !removedImages.includes(image.public_id),
      );

      for (const image of imagesToRemove) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (error) {
          console.error(
            `Cloudinary delete error for ${image.public_id}:`,
            error.message,
          );
        }
      }
    }

    if (req.files && req.files.length > 0) {
      const totalImages = ad.images.length + req.files.length;

      if (totalImages > 5) {
        return res.status(400).json({
          success: false,
          message: `Maximum 5 images allowed. You currently have ${ad.images.length} image(s).`,
        });
      }

      const newImages = [];

      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "olx-clone/ads");

        newImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }

      ad.images = [...ad.images, ...newImages];
    }

    const updatedAd = await ad.save();

    if (isOwner && !isAdminUser && updatedAd.status === "pending") {
      try {
        const populatedAd = await Ad.findById(updatedAd._id)
          .populate("user", "name email")
          .populate("category", "name");

        await sendAdReviewEmail(populatedAd, req.user);
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message:
        isOwner && !isAdminUser
          ? "Ad updated and sent for admin approval"
          : "Ad updated successfully",
      ad: updatedAd,
    });
  } catch (error) {
    console.error("Update Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ad",
      error: error.message,
    });
  }
};

// ========================================
// DELETE AD
// ========================================

const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    const isOwner = ad.user.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this ad",
      });
    }

    if (ad.images && ad.images.length > 0) {
      for (const image of ad.images) {
        try {
          await deleteFromCloudinary(image);
        } catch (error) {
          console.error(
            `Cloudinary delete error for image:`,
            error.message,
          );
        }
      }
    }

    await Ad.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("Delete Ad Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete ad",
      error: error.message,
    });
  }
};

module.exports = {
  createAd,
  getAllAds,
  getAdById,
  getMyAds,
  getPendingAds,
  approveAdHandler,
  rejectAdHandler,
  handleEmailAction,
  updateAd,
  deleteAd,
};
