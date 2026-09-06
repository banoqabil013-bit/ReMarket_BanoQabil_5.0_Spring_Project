const express = require("express");

const {
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
} = require("../controller/adsController.js");

const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin.js");

const router = express.Router();

// ========================================
// PUBLIC ROUTES
// ========================================

router.get("/", getAllAds);

// Email approve/reject links (no login required)
router.get("/email-action", handleEmailAction);

// ========================================
// ADMIN ROUTES
// ========================================

router.get("/admin/pending", auth, isAdmin, getPendingAds);
router.put("/admin/:id/approve", auth, isAdmin, approveAdHandler);
router.put("/admin/:id/reject", auth, isAdmin, rejectAdHandler);

// ========================================
// PROTECTED ROUTES
// ========================================

router.get("/my-ads", auth, getMyAds);
router.post("/", auth, upload.array("images", 5), createAd);
router.put("/:id", auth, upload.array("images", 5), updateAd);
router.delete("/:id", auth, deleteAd);

// ========================================
// PUBLIC SINGLE AD
// ========================================

router.get("/:id", getAdById);

module.exports = router;
