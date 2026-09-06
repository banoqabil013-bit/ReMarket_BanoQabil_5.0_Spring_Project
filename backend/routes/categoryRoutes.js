const express = require("express");

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/categoryController");

const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all
router.get("/", getCategories);

// Get single
router.get("/:id", getCategory);

// Create category
router.post(
  "/",
  auth,
  upload.single("icon"),
  createCategory
);

// Update category
router.put(
  "/:id",
  auth,
  upload.single("icon"),
  updateCategory
);

// Delete category
router.delete(
  "/:id",
  auth,
  deleteCategory
);

module.exports = router;
