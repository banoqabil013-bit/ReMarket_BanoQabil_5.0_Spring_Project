const Category = require("./models/Category");

const defaultCategories = [
  "Mobiles",
  "Vehicles",
  "Electronics",
  "Home",
  "Fashion",
  "Sports",
];

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();

    if (count > 0) {
      return;
    }

    await Category.insertMany(
      defaultCategories.map((name) => ({
        name,
        icon: "",
        status: "active",
      })),
    );

    console.log("Default categories seeded successfully");
  } catch (error) {
    console.error("Category seeding failed:", error.message);
  }
};

module.exports = seedDefaultCategories;
