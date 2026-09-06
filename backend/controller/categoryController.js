const Category = require("../models/Category");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinaryUpload.js");

// ========================================
// CREATE CATEGORY
// ========================================

const createCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check duplicate
    const exists = await Category.findOne({
      name: name.trim(),
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Upload category icon to Cloudinary
    let icon = null;

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "olx-clone/categories"
      );

      icon = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      icon,
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL CATEGORIES
// ========================================

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE CATEGORY
// ========================================

const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE CATEGORY
// ========================================

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const { name, status } = req.body;

    // Check duplicate name
    if (name !== undefined && name.trim() !== category.name) {
      const exists = await Category.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Category already exists",
        });
      }

      category.name = name.trim();
    }

    if (status !== undefined) {
      category.status = status;
    }

    // ========================================
    // NEW CATEGORY ICON
    // ========================================

    if (req.file) {
      // Delete old Cloudinary image
      if (
        category.icon &&
        category.icon.public_id
      ) {
        try {
          await deleteFromCloudinary(
            category.icon.public_id
          );
        } catch (error) {
          console.error(
            "Old category icon delete error:",
            error.message
          );
        }
      }

      // Upload new icon
      const result = await uploadToCloudinary(
        req.file.buffer,
        "olx-clone/categories"
      );

      category.icon = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// ========================================
// DELETE CATEGORY
// ========================================

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Delete icon from Cloudinary
    if (
      category.icon &&
      category.icon.public_id
    ) {
      try {
        await deleteFromCloudinary(
          category.icon.public_id
        );
      } catch (error) {
        console.error(
          "Category icon delete error:",
          error.message
        );
      }
    }

    // Delete category
    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
