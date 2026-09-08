const Ad = require("../models/Ads.js");
const User = require("../models/Users.js");
const Notification = require("../models/Notification.js");
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
    const { title, description, category, price, condition, city, phone } = req.body;

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
      phone: phone ? phone.trim() : (req.user?.phone || null),
      status: "pending",
    });

    const populatedAd = await Ad.findById(ad._id)
      .populate("user", "name email phone city createdAt profileImage isVerified")
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
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(40, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const total = await Ad.countDocuments({ status: "active" });
    const ads = await Ad.find({ status: "active" })
      .populate("user", "name email phone city createdAt profileImage isVerified")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
      .populate("user", "name email phone city createdAt profileImage isVerified")
      .populate("category", "name");

    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    if (!["active", "sold"].includes(ad.status)) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    // Increment views
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Fetch similar ads (same category, exclude this ad, max 6)
    let similarAds = [];
    if (ad.category?._id) {
      similarAds = await Ad.find({
        status: "active",
        category: ad.category._id,
        _id: { $ne: ad._id },
      })
        .populate("user", "name city profileImage isVerified")
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(6);
    }

    return res.status(200).json({ success: true, ad, similarAds });
  } catch (error) {
    console.error("Get Single Ad Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch ad", error: error.message });
  }
};

// ========================================
// GET MY ADS
// ========================================

const getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ user: req.user._id })
      .populate("user", "name email phone city createdAt profileImage isVerified")
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

  try {
    await Notification.create({
      recipient: ad.user._id,
      type: "ad_approved",
      title: "Ad Approved!",
      message: `Your ad "${ad.title}" has been approved and is now live.`,
      link: `/ads/${ad._id}`,
    });
  } catch (notifErr) {
    console.error("Failed to send in-app approval notification:", notifErr.message);
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

  try {
    await Notification.create({
      recipient: ad.user._id,
      type: "ad_rejected",
      title: "Ad Rejected",
      message: `Your ad "${ad.title}" was rejected. You may edit and resubmit.`,
      link: `/my-ads`,
    });
  } catch (notifErr) {
    console.error("Failed to send in-app rejection notification:", notifErr.message);
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

    const { title, description, category, price, condition, city, phone } = req.body;

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

    if (phone !== undefined) {
      ad.phone = phone ? phone.trim() : null;
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

// ========================================
// CONTACT SELLER (INQUIRY / DIRECT MESSAGE)
// ========================================

const contactSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message for the seller.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Your name is required.",
      });
    }

    const ad = await Ad.findById(id).populate("user", "name email phone");
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found.",
      });
    }

    if (ad.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This ad is no longer active.",
      });
    }

    const sellerEmail = ad.user?.email;
    if (!sellerEmail) {
      return res.status(400).json({
        success: false,
        message: "Seller email address is not available.",
      });
    }

    const adUrl = `${FRONTEND_URL}/ads/${ad._id}`;
    const adThumbnail = ad.images?.[0]?.url || "";
    const priceFormatted = Number(ad.price || 0).toLocaleString();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">ReMarket</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">You have a new buyer inquiry!</p>
        </div>

        <div style="padding: 24px;">
          <!-- Ad Mini Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            ${adThumbnail ? `<img src="${adThumbnail}" alt="${ad.title}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />` : ""}
            <h3 style="margin: 0 0 4px; color: #0f172a; font-size: 18px;">${ad.title}</h3>
            <p style="margin: 0 0 6px; color: #7c3aed; font-weight: 700; font-size: 18px;">Rs. ${priceFormatted}</p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">📍 ${ad.city} • Condition: ${ad.condition}</p>
          </div>

          <!-- Buyer Message -->
          <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 4px 12px 12px 4px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">Buyer's Message:</p>
            <p style="margin: 0; font-size: 15px; color: #1e1b4b; line-height: 1.5; white-space: pre-line;">"${message.trim()}"</p>
          </div>

          <!-- Buyer Contact Details -->
          <h4 style="margin: 0 0 12px; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Buyer Contact Details:</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 30%;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${name.trim()}</td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${phone.trim()}" style="color: #7c3aed; font-weight: 600; text-decoration: none;">${phone.trim()}</a></td>
            </tr>` : ""}
            ${email ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email.trim()}" style="color: #7c3aed; font-weight: 600; text-decoration: none;">${email.trim()}</a></td>
            </tr>` : ""}
          </table>

          <!-- Action Buttons -->
          <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            ${email ? `<a href="mailto:${email.trim()}?subject=Re: Inquiry on ${encodeURIComponent(ad.title)}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 22px; border-radius: 10px; font-weight: 600; text-decoration: none; margin: 4px;">Reply via Email</a>` : ""}
            ${phone ? `<a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 12px 22px; border-radius: 10px; font-weight: 600; text-decoration: none; margin: 4px;">Chat on WhatsApp</a>` : ""}
            <a href="${adUrl}" style="display: inline-block; background-color: #f1f5f9; color: #475569; padding: 12px 22px; border-radius: 10px; font-weight: 600; text-decoration: none; margin: 4px;">View Your Ad</a>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          This message was sent through <a href="${FRONTEND_URL}" style="color: #7c3aed; text-decoration: none;">ReMarket</a>. For your safety, do not share banking passwords or OTP codes with anyone.
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: sellerEmail,
        subject: `[ReMarket] New inquiry from ${name.trim()} on "${ad.title}"`,
        html,
      });
    } catch (emailError) {
      console.error("Failed to send inquiry email:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been sent to the seller!",
    });
  } catch (error) {
    console.error("Contact Seller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message to seller",
      error: error.message,
    });
  }
};

// ========================================
// MARK AS SOLD
// ========================================

const markAsSold = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    // Only the owner can mark as sold
    if (ad.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (ad.status === "sold") {
      return res.status(400).json({ success: false, message: "Ad is already marked as sold" });
    }

    ad.status = "sold";
    await ad.save();

    return res.status(200).json({ success: true, message: "Ad marked as sold", ad });
  } catch (error) {
    console.error("Mark As Sold Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update ad status", error: error.message });
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
  contactSeller,
  markAsSold,
};

